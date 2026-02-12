/**
 * Session Controller
 * 
 * Handles session verification and context hydration.
 */

import { Request, Response } from '../middleware';
import { JWTService } from '../../../core/auth/jwt';
import { AuthRepository } from '../../../adapters/prisma/repositories/auth-repository';
import { getPrismaClient } from '../../../adapters/prisma/client';
import type { AuthSessionResponse } from '@/src/types/auth';

const authRepo = new AuthRepository();
const prisma = getPrismaClient();

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
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

type TenantSettingsSessionRow = {
  trade_name: string | null;
  is_open: boolean;
  address_city: string | null;
  address_state: string | null;
  timezone: string | null;
  payment_provider_default: string | null;
  payment_public_key: string | null;
  payment_private_key: string | null;
  kds_enabled: boolean;
  pdv_enabled: boolean;
  realtime_enabled: boolean;
  printing_enabled: boolean;
};

function isTenantSettingsSessionRow(value: unknown): value is TenantSettingsSessionRow {
  if (!isRecord(value)) return false;
  return (
    isNullableString(value.trade_name) &&
    isBoolean(value.is_open) &&
    isNullableString(value.address_city) &&
    isNullableString(value.address_state) &&
    isNullableString(value.timezone) &&
    isNullableString(value.payment_provider_default) &&
    isNullableString(value.payment_public_key) &&
    isNullableString(value.payment_private_key) &&
    isBoolean(value.kds_enabled) &&
    isBoolean(value.pdv_enabled) &&
    isBoolean(value.realtime_enabled) &&
    isBoolean(value.printing_enabled)
  );
}

export async function getSession(req: Request, res: Response) {
  const authContextHeader = req.headers['x-auth-context'];
  const authContext = typeof authContextHeader === 'string' ? authContextHeader : null;

  const cookieHeader = req.headers['cookie'];
  const authHeader = req.headers['authorization'];

  let token: string | null = null;

  if (typeof cookieHeader === 'string') {
    if (authContext === 'saas_admin') {
      token = parseCookieValue(cookieHeader, 'saas_auth_token');
    } else if (authContext === 'tenant_user') {
      token = parseCookieValue(cookieHeader, 'tenant_auth_token');
    } else {
      token =
        parseCookieValue(cookieHeader, 'saas_auth_token') ??
        parseCookieValue(cookieHeader, 'tenant_auth_token');
    }
  }

  if (!token && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1] ?? null;
  }

  if (!token) {
    console.log('[Session] Missing auth token', {
      hasCookie: typeof cookieHeader === 'string',
      hasAuthorization: typeof req.headers['authorization'] === 'string',
      authContext,
      tenantSlug: req.headers['x-tenant-slug'],
    });
    res.status = 401;
    res.body = { error: 'Missing auth token' };
    return;
  }

  try {
    const decoded = JWTService.decode(token);

    if (!isRecord(decoded)) {
      throw new Error('Invalid token');
    }

    const context = decoded.context;
    console.log('[Session] Incoming session validation', {
      context,
      hasTenantSlug: typeof req.headers['x-tenant-slug'] === 'string' && req.headers['x-tenant-slug'].trim() !== '',
    });
    
    // Check token type based on context field in payload
    if (context === 'tenant_user') {
       console.log('[Session] Validating as tenant_user token');
       const payload = JWTService.verifyTenantUserToken(token);
       console.log('[Session] Tenant user token validated successfully:', { userId: payload.userId, tenantId: payload.tenantId, role: payload.role });

       if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
         throw new Error('Invalid userId in token');
       }
       if (typeof payload.tenantId !== 'string' || payload.tenantId.length === 0) {
         throw new Error('Invalid tenantId in token');
       }

       const tenantId = payload.tenantId;
       
       // Try to get tenant from header first, fallback to token
       let tenant;
       const tenantSlugFromHeader = req.headers['x-tenant-slug'];
       
       if (tenantSlugFromHeader && typeof tenantSlugFromHeader === 'string') {
         console.log('[Session] Looking for tenant by slug:', tenantSlugFromHeader);
         tenant = await prisma.tenant.findFirst({
           where: { slug: tenantSlugFromHeader },
           select: { id: true, name: true, slug: true, status: true, onboarded: true },
         });
       } else {
         console.log('[Session] Looking for tenant by ID:', tenantId);
         tenant = await prisma.tenant.findUnique({
           where: { id: tenantId },
           select: { id: true, name: true, slug: true, status: true, onboarded: true },
         });
       }

       console.log('[Session] Tenant found:', tenant ? { id: tenant.id, slug: tenant.slug, status: tenant.status } : 'NOT FOUND');

       if (!tenant) {
         throw new Error(`Tenant not found: ${tenantSlugFromHeader || tenantId}`);
       }

       if (tenant.status !== 'active') {
         throw new Error('Tenant is not active');
       }

       console.log('[Session] Looking for tenant user:', { userId: payload.userId, tenantId: tenant.id });
       const tenantUser = await prisma.tenantUser.findFirst({
         where: { id: payload.userId, tenant_id: tenant.id },
         include: {
           userRoles: {
             include: { role: true },
           },
         },
       });

       console.log('[Session] Tenant user found:', !!tenantUser);

       if (!tenantUser) {
         throw new Error('User not found in tenant');
       }

       console.log('[Session] Tenant user authentication successful');
       
       const subscription = await prisma.tenantSubscription.findFirst({
         where: { tenant_id: tenant.id, status: 'active' },
         include: { plan: true },
         orderBy: { created_at: 'desc' },
       });
       const plan = subscription ? subscription.plan : null;
       const subscriptionPayload = subscription
         ? {
             id: subscription.id,
             status: subscription.status,
             plan: subscription.plan
               ? {
                   id: subscription.plan.id,
                   name: subscription.plan.name,
                 }
               : null,
           }
         : null;

       const permissions = await authRepo.getTenantUserPermissions(tenantUser.id, tenant.id);
       const activeModules = await authRepo.getTenantActiveModules(tenant.id);
       const tenantSettingsRow: unknown = await prisma.tenantSettings.findUnique({
        where: { tenant_id: tenant.id },
      });
      const tenantSettings = isTenantSettingsSessionRow(tenantSettingsRow)
         ? {
             tradeName: tenantSettingsRow.trade_name,
             isOpen: tenantSettingsRow.is_open,
             city: tenantSettingsRow.address_city,
             state: tenantSettingsRow.address_state,
             timezone: tenantSettingsRow.timezone,
             paymentProviderDefault: tenantSettingsRow.payment_provider_default,
             paymentPublicKey: tenantSettingsRow.payment_public_key,
             paymentPrivateKey: tenantSettingsRow.payment_private_key,
             kdsEnabled: tenantSettingsRow.kds_enabled,
             pdvEnabled: tenantSettingsRow.pdv_enabled,
             realtimeEnabled: tenantSettingsRow.realtime_enabled,
             printingEnabled: tenantSettingsRow.printing_enabled,
           }
         : null;

       res.status = 200;
       const body: AuthSessionResponse = {
         user: {
           id: tenantUser.id,
           email: tenantUser.email,
           role: tenantUser.userRoles[0]?.role.slug || 'user'
         },
         tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            onboarded: tenant.onboarded,
          },
         activeModules,
         permissions,
         subscription: subscriptionPayload,
         plan: plan ? {
            id: plan.id,
            name: plan.name
         } : null,
         tenantSettings,
         theme: null
       };
       res.body = body;
       return;
    }

    if (context === 'saas_admin') {
       console.log('[Session] Validating as saas_admin token');
       const payload = JWTService.verifySaaSAdminToken(token);
       console.log('[Session] SaaS admin token validated successfully:', { userId: payload.userId, role: payload.role });
       
       console.log('[Session] Looking for SaaS admin user:', payload.userId);
       const user = await authRepo.findSaaSAdminById(payload.userId);
       console.log('[Session] SaaS admin user found:', !!user);
       
       if (!user) throw new Error('SaaS Admin user not found');

       console.log('[Session] SaaS admin authentication successful');

       res.status = 200;
       const body: AuthSessionResponse = {
         user: {
           id: user.id,
           email: user.email,
           role: 'SAAS_ADMIN'
         },
         tenant: null,
         activeModules: [],
         permissions: [],
         plan: null,
         theme: null
       };
       res.body = body;
       return;
    }

    throw new Error('Invalid token context');

  } catch (error: unknown) {
    console.log('[Session] Session validation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status = 401;
    res.body = {
      error:
        error instanceof Error ? error.message : 'Invalid session',
    };
  }
}
