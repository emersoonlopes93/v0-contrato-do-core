import {
  errorHandler,
  requireModule,
  requireTenantAuth,
  requestLogger,
  type AuthenticatedRequest,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import type { TenantSettingsServiceContract } from '@/src/types/tenant-settings';
import { parseTenantSettingsUpdateRequest } from './tenant-settings.service';

function getService(): TenantSettingsServiceContract | null {
  return globalModuleServiceRegistry.get<TenantSettingsServiceContract>(
    asModuleId('settings'),
    'TenantSettingsService',
  );
}

function getAuth(req: Request, res: Response): { tenantId: string } | null {
  const authReq = req as AuthenticatedRequest;
  const auth = authReq.auth;
  if (!auth || !auth.tenantId) {
    res.status = 401;
    res.body = { error: 'Unauthorized', message: 'Authentication context is missing' };
    return null;
  }
  return { tenantId: auth.tenantId };
}

async function handleGet(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'TenantSettings service not found' };
    return;
  }

  try {
    const data = await service.getByTenantId(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load settings' };
  }
}

async function handlePut(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'TenantSettings service not found' };
    return;
  }

  const parsed = parseTenantSettingsUpdateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.upsert(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update settings' };
  }
}

export const tenantSettingsTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/settings',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('settings')],
    handler: handleGet,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/settings',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('settings')],
    handler: handlePut,
  },
];

