/**
 * Tenant Auth Controller
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import { Request, Response } from '../middleware';
import { TenantAuthService } from '../../../core/auth/tenant/tenant-auth.service';
import type { TenantUserLoginRequest } from '@/core/auth';
import { getPrismaClient } from '../../../adapters/prisma/client';

const tenantAuth = new TenantAuthService();
const prisma = getPrismaClient();

function buildDevCookie(name: string, value: string): string {
  const encoded = encodeURIComponent(value);
  return `${name}=${encoded}; HttpOnly; SameSite=Lax; Path=/`;
}

function parseCookieValue(cookieHeader: string, key: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${key}=`)) continue;
    const value = trimmed.slice(key.length + 1);
    const decoded = decodeURIComponent(value);
    return decoded.length > 0 ? decoded : null;
  }
  return null;
}

function isTenantUserLoginBody(
  body: unknown,
): body is Pick<TenantUserLoginRequest, 'email' | 'password'> {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.email === 'string' &&
    typeof candidate.password === 'string'
  );
}

export async function tenantLogin(req: Request, res: Response) {
  const body = req.body;

  if (!isTenantUserLoginBody(body)) {
    res.status = 400;
    res.body = { error: 'Email and password are required' };
    return;
  }

  const { email, password } = body;

  try {
    const rawSlug = req.headers['x-tenant-slug'];
    const rawSubdomain = req.headers['x-tenant-subdomain'];

    const slug =
      (typeof rawSlug === 'string' && rawSlug.trim() !== '' ? rawSlug.trim() : null) ??
      (typeof rawSubdomain === 'string' && rawSubdomain.trim() !== '' ? rawSubdomain.trim() : null);

    if (!slug) {
      res.status = 400;
      res.body = { error: 'Tenant não resolvido' };
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Tenant not found' };
      return;
    }

    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Tenant is not active' };
      return;
    }

    const result = await tenantAuth.login({
      tenantId: tenant.id,
      email,
      password,
    });

    res.status = 200;
    res.headers = {
      'Set-Cookie': [
        buildDevCookie('tenant_auth_token', result.accessToken),
        buildDevCookie('tenant_refresh_token', result.refreshToken),
      ],
    };
    res.body = {
      ok: true,
      tenantId: tenant.id,
      activeModules: result.activeModules,
      role: result.user.role,
      permissions: result.user.permissions,
      email: result.user.email,
    };
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error:
        error instanceof Error
          ? error.message
          : 'Authentication failed',
    };
  }
}

function isRefreshBody(body: unknown): body is { refreshToken: string } {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return typeof candidate.refreshToken === 'string' && candidate.refreshToken.trim().length > 0;
}

export async function tenantRefresh(req: Request, res: Response) {
  const cookieHeader = req.headers['cookie'];
  const cookieRefresh =
    typeof cookieHeader === 'string'
      ? parseCookieValue(cookieHeader, 'tenant_refresh_token')
      : null;

  const body = req.body;
  const bodyRefresh = isRefreshBody(body) ? body.refreshToken : null;
  const refreshToken = cookieRefresh ?? bodyRefresh;

  if (!refreshToken) {
    res.status = 400;
    res.body = { error: 'refreshToken is required' };
    return;
  }

  try {
    const result = await tenantAuth.refreshToken(refreshToken);
    res.status = 200;
    res.headers = {
      'Set-Cookie': [buildDevCookie('tenant_auth_token', result.accessToken)],
    };
    res.body = { ok: true };
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error: error instanceof Error ? error.message : 'Refresh token inválido',
    };
  }
}
