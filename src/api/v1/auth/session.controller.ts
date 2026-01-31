/**
 * Session Controller
 * 
 * Handles session verification and context hydration.
 */

import { Request, Response } from '../middleware';
import { JWTService } from '../../../core/auth/jwt';
import { AuthRepository } from '../../../adapters/prisma/repositories/auth-repository';
import { getPrismaClient } from '../../../adapters/prisma/client';

const authRepo = new AuthRepository();
const prisma = getPrismaClient();

export async function getSession(req: Request, res: Response) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status = 401;
    res.body = { error: 'Missing authorization header' };
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = JWTService.decode(token);

    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token');
    }

    const decodedWithContext = decoded as { context?: string };

    // Check token type based on context field in payload
    if (decodedWithContext.context === 'saas_admin') {
       const payload = JWTService.verifySaaSAdminToken(token);
       const user = await authRepo.findSaaSAdminById(payload.userId);
       
       if (!user) throw new Error('User not found');

       res.status = 200;
       res.body = {
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
       return;
    }

    if (decodedWithContext.context === 'tenant_user') {
       const payload = JWTService.verifyTenantUserToken(token);
       
       const tenantUser = await prisma.tenantUser.findUnique({
         where: { id: payload.userId },
         include: {
           userRoles: {
             include: { role: true }
           },
           tenant: {
             include: {
               subscriptions: {
                 where: { status: 'active' },
                 include: { plan: true },
                 take: 1
               }
             }
           }
         }
       });

       if (!tenantUser) {
         throw new Error('User not found');
       }

       const subscription = tenantUser.tenant.subscriptions[0];
       const plan = subscription ? subscription.plan : null;

       const permissions = await authRepo.getTenantUserPermissions(tenantUser.id, payload.tenantId);
       const activeModules = await authRepo.getTenantActiveModules(payload.tenantId);
       const tenantWithOnboardFlag = tenantUser.tenant as unknown as { onboarded?: boolean };
       const isOnboarded = tenantWithOnboardFlag.onboarded === true;
       const tenantStatus = tenantUser.tenant.status;

       res.status = 200;
       res.body = {
         user: {
           id: tenantUser.id,
           email: tenantUser.email,
           role: tenantUser.userRoles[0]?.role.slug || 'user'
         },
         tenant: {
            id: tenantUser.tenant.id,
            name: tenantUser.tenant.name,
            slug: tenantUser.tenant.slug,
            status: tenantStatus,
            onboarded: isOnboarded,
          },
         activeModules,
         permissions,
         plan: plan ? {
            id: plan.id,
            name: plan.name
         } : null,
         theme: null
       };
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
