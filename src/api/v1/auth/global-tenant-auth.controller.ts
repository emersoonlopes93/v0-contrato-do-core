/**
 * Global Tenant Auth Controller
 *
 * Login do tenant sem contexto prévio de tenant (sem slug/header).
 * Resolve o tenant a partir do relacionamento tenant_user (email).
 */

import { Request, Response } from '../middleware';
import { TenantAuthService } from '../../../core/auth/tenant/tenant-auth.service';
import { getPrismaClient } from '../../../adapters/prisma/client';
import type { GlobalTenantLoginRequest, GlobalTenantLoginResponse } from '@/src/types/auth';

const prisma = getPrismaClient();
const tenantAuth = new TenantAuthService();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGlobalTenantLoginBody(body: unknown): body is GlobalTenantLoginRequest {
  if (!isRecord(body)) return false;
  return typeof body.email === 'string' && typeof body.password === 'string';
}

export async function tenantGlobalLogin(req: Request, res: Response) {
  const body = req.body;

  if (!isGlobalTenantLoginBody(body)) {
    res.status = 400;
    res.body = { error: 'Email and password are required' };
    return;
  }

  const email = body.email.trim();
  const password = body.password;

  if (email.length === 0 || password.length === 0) {
    res.status = 400;
    res.body = { error: 'Email and password are required' };
    return;
  }

  try {
    const matches = await prisma.tenantUser.findMany({
      where: { email },
      select: {
        id: true,
        tenant_id: true,
      },
      take: 2,
    });

    if (matches.length === 0) {
      res.status = 401;
      res.body = { error: 'Invalid credentials' };
      return;
    }

    if (matches.length > 1) {
      res.status = 409;
      res.body = { error: 'Usuário pertence a múltiplos tenants' };
      return;
    }

    const tenantId = matches[0].tenant_id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true, status: true },
    });

    if (!tenant) {
      res.status = 401;
      res.body = { error: 'Tenant not found' };
      return;
    }

    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Tenant is not active' };
      return;
    }

    const result = await tenantAuth.login({
      tenantId,
      email,
      password,
    });

    const response: GlobalTenantLoginResponse = {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name ?? null,
        role: result.user.role,
        permissions: result.user.permissions,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      accessToken: result.accessToken,
    };

    res.status = 200;
    res.body = response;
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

