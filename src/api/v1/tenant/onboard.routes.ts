import {
  requireTenantAuth,
  requestLogger,
  errorHandler,
  type Route,
  type Request,
  type Response,
  type AuthenticatedRequest,
} from '@/src/api/v1/middleware';
import { prisma } from '@/src/adapters/prisma/client';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import type { StoreSettingsServiceContract } from '@/src/types/store-settings';

function getStoreSettingsService(): StoreSettingsServiceContract | null {
  return globalModuleServiceRegistry.get<StoreSettingsServiceContract>(
    asModuleId('store-settings'),
    'StoreSettingsService',
  );
}

async function handleCompleteOnboarding(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const auth = authReq.auth;

  if (!auth || !auth.tenantId) {
    res.status = 401;
    res.body = {
      error: 'Unauthorized',
      message: 'Authentication context is missing',
    };
    return;
  }

  try {
    const storeSettingsService = getStoreSettingsService();
    if (!storeSettingsService) {
      res.status = 500;
      res.body = { error: 'Internal Server Error', message: 'Store Settings service not found' };
      return;
    }

    const ok = await storeSettingsService.isComplete(auth.tenantId);
    if (!ok) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'StoreSettings incompleto' };
      return;
    }

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        onboarded: true,
        onboarded_at: new Date(),
      },
    });

    res.status = 200;
    res.body = {
      success: true,
    };
  } catch (error) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to complete onboarding',
    };
  }
}

export const tenantOnboardRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/tenant/onboard/complete',
    middlewares: [requestLogger, errorHandler, requireTenantAuth],
    handler: handleCompleteOnboarding,
  },
];
