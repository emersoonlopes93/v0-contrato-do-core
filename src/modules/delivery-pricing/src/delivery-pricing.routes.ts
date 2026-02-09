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
import type { DeliveryPricingServiceContract } from '@/src/types/delivery-pricing';
import { deliveryPricingParsers } from './services/deliveryPricingService';

function getService(): DeliveryPricingServiceContract | null {
  return globalModuleServiceRegistry.get<DeliveryPricingServiceContract>(
    asModuleId('delivery-pricing'),
    'DeliveryPricingService',
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
    res.body = { error: 'Internal Server Error', message: 'DeliveryPricing service not found' };
    return;
  }

  try {
    const data = await service.getSettings(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load delivery pricing' };
  }
}

async function handleCreate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'DeliveryPricing service not found' };
    return;
  }

  const parsed = deliveryPricingParsers.parseCreateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.upsertSettings(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create delivery pricing' };
  }
}

async function handleUpdate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'DeliveryPricing service not found' };
    return;
  }

  const parsed = deliveryPricingParsers.parseUpdateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateSettings(auth.tenantId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Configuração não encontrada' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update delivery pricing' };
  }
}

async function handlePreview(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'DeliveryPricing service not found' };
    return;
  }

  const parsed = deliveryPricingParsers.parsePreviewRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.preview(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to preview delivery pricing' };
  }
}

async function handleApplyRoute(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'DeliveryPricing service not found' };
    return;
  }

  const parsed = deliveryPricingParsers.parseApplyRouteRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    await service.applyRoutePricing(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data: null };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to apply delivery pricing' };
  }
}

export const deliveryPricingTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-pricing',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-pricing'),
      requirePermission('delivery-pricing.read'),
    ],
    handler: handleGet,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-pricing',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-pricing'),
      requirePermission('delivery-pricing.write'),
    ],
    handler: handleCreate,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/delivery-pricing',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-pricing'),
      requirePermission('delivery-pricing.write'),
    ],
    handler: handleUpdate,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-pricing/preview',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-pricing'),
      requirePermission('delivery-pricing.read'),
    ],
    handler: handlePreview,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-pricing/apply-route',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-pricing'),
      requirePermission('delivery-pricing.write'),
    ],
    handler: handleApplyRoute,
  },
];
