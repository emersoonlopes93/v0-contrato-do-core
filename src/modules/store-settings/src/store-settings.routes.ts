import {
  errorHandler,
  requireModule,
  requirePermission,
  requireTenantAuth,
  requestLogger,
  type AuthenticatedRequest,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import type { StoreSettingsServiceContract } from '@/src/types/store-settings';
import {
  parseStoreSettingsCreateRequest,
  parseStoreSettingsUpdateRequest,
} from './store-settings.service';

function getService(): StoreSettingsServiceContract | null {
  return globalModuleServiceRegistry.get<StoreSettingsServiceContract>(
    asModuleId('store-settings'),
    'StoreSettingsService',
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
    res.body = { error: 'Internal Server Error', message: 'StoreSettings service not found' };
    return;
  }

  try {
    const data = await service.getByTenantId(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load store settings' };
  }
}

async function handleCreate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'StoreSettings service not found' };
    return;
  }

  const parsed = parseStoreSettingsCreateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.create(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create store settings' };
  }
}

async function handleUpdate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'StoreSettings service not found' };
    return;
  }

  const parsed = parseStoreSettingsUpdateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.update(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update store settings' };
  }
}

export const storeSettingsTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/store-settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('store-settings'),
      requirePermission('store-settings.read'),
    ],
    handler: handleGet,
  },
  {
    method: 'POST',
    path: '/api/v1/store-settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('store-settings'),
      requirePermission('store-settings.write'),
    ],
    handler: handleCreate,
  },
  {
    method: 'PATCH',
    path: '/api/v1/store-settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('store-settings'),
      requirePermission('store-settings.write'),
    ],
    handler: handleUpdate,
  },
];

