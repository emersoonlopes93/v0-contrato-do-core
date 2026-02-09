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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
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
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status = 401;
    res.body = { error: 'Missing authorization header' };
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status = 401;
    res.body = { error: 'Missing authorization header' };
    return;
  }

  try {
    const decoded = JWTService.decode(token);

    if (!isRecord(decoded)) {
      throw new Error('Invalid token');
    }

    const context = decoded.context;
    if (context !== 'saas_admin' && context !== 'tenant_user') {
      throw new Error('Invalid token context');
    }

    // Check token type based on context field in payload
    if (context === 'saas_admin') {
       const payload = JWTService.verifySaaSAdminToken(token);
       const user = await authRepo.findSaaSAdminById(payload.userId);
       
       if (!user) throw new Error('User not found');

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

    if (context === 'tenant_user') {
       const payload = JWTService.verifyTenantUserToken(token);

       if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
         throw new Error('Invalid token');
       }
       if (typeof payload.tenantId !== 'string' || payload.tenantId.length === 0) {
         throw new Error('Invalid token');
       }

       const tenantId = payload.tenantId;

       const tenant = await prisma.tenant.findUnique({
         where: { id: tenantId },
         select: { id: true, name: true, slug: true, status: true, onboarded: true },
       });

       if (!tenant) {
         throw new Error('Tenant not found');
       }

       if (tenant.status !== 'active') {
         throw new Error('Tenant is not active');
       }

       const tenantUser = await prisma.tenantUser.findFirst({
         where: { id: payload.userId, tenant_id: tenantId },
         include: {
           userRoles: {
             include: { role: true },
           },
         },
       });

       if (!tenantUser) {
         throw new Error('User not found');
       }

       const subscription = await prisma.tenantSubscription.findFirst({
         where: { tenant_id: tenantId, status: 'active' },
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

       const permissions = await authRepo.getTenantUserPermissions(tenantUser.id, tenantId);
       const activeModules = await authRepo.getTenantActiveModules(tenantId);
       const tenantSettingsRow: unknown = await prisma.tenantSettings.findUnique({
        where: { tenant_id: tenantId },
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

    throw new Error('Invalid token context');

  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error:
        error instanceof Error ? error.message : 'Invalid session',
    };
  }
}
