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
import type { CheckoutServiceContract } from '@/src/types/checkout';
import { parseCheckoutCreateOrderRequest } from './checkout.service';

function getService(): CheckoutServiceContract | null {
  return globalModuleServiceRegistry.get<CheckoutServiceContract>(
    asModuleId('checkout'),
    'CheckoutService',
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

async function handleCheckout(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Checkout service not found' };
    return;
  }

  const parsed = parseCheckoutCreateOrderRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createOrder(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: error instanceof Error ? error.message : 'Checkout failed' };
  }
}

async function handleGetOrder(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const orderId = req.params?.id;
  if (!orderId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing id' };
    return;
  }

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Checkout service not found' };
    return;
  }

  try {
    const data = await service.getOrderById(auth.tenantId, orderId);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Order not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load order' };
  }
}

export const checkoutRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/checkout',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('checkout'),
      requirePermission('checkout:create'),
    ],
    handler: handleCheckout,
  },
  {
    method: 'GET',
    path: '/api/v1/orders/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('checkout'),
      requirePermission('checkout:create'),
    ],
    handler: handleGetOrder,
  },
];

