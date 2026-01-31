import {
  requireTenantAuth,
  requireModule,
  requirePermission,
  requestLogger,
  errorHandler,
  type Route,
  type Request,
  type Response,
  type AuthenticatedRequest,
} from '@/src/api/v1/middleware';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';

type CreateOrderBody = {
  orderId?: string;
  totalAmount?: number;
  items?: unknown[];
};

type OrdersServiceContract = {
  createOrder(request: {
    tenantId: string;
    userId: string;
    orderId: string;
    totalAmount: number;
    items: number;
  }): Promise<void>;
  listOrdersByTenant(tenantId: string): Promise<unknown[]>;
};

function getOrdersService(): OrdersServiceContract | null {
  return globalModuleServiceRegistry.get<OrdersServiceContract>(
    asModuleId('orders-module'),
    'OrdersService',
  );
}

async function handleCreateOrder(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const body = req.body as CreateOrderBody | undefined;

  const orderId = body?.orderId;
  const totalAmount = body?.totalAmount;
  const items = body?.items;

  if (!orderId || typeof orderId !== 'string') {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "orderId" is required and must be a string',
    };
    return;
  }

  if (typeof totalAmount !== 'number' || Number.isNaN(totalAmount)) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "totalAmount" is required and must be a number',
    };
    return;
  }

  if (!Array.isArray(items)) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "items" is required and must be an array',
    };
    return;
  }

  const auth = authReq.auth;

  if (!auth || !auth.tenantId || !auth.userId) {
    res.status = 401;
    res.body = {
      error: 'Unauthorized',
      message: 'Authentication context is missing',
    };
    return;
  }

  const ordersService = getOrdersService();

  if (!ordersService) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: 'Orders module service not found',
    };
    return;
  }

  try {
    await ordersService.createOrder({
      tenantId: auth.tenantId,
      userId: auth.userId,
      orderId,
      totalAmount,
      items: items.length,
    });

    res.status = 201;
    res.body = {
      success: true,
      message: 'Order created successfully',
    };
  } catch (error) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

async function handleListOrders(req: Request, res: Response): Promise<void> {
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

  const ordersService = getOrdersService();

  if (!ordersService) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: 'Orders module service not found',
    };
    return;
  }

  try {
    const orders = await ordersService.listOrdersByTenant(auth.tenantId);

    res.status = 200;
    res.body = {
      success: true,
      data: orders,
    };
  } catch (error) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list orders',
    };
  }
}

export const ordersTenantRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/tenant/orders',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('orders-module'),
      requirePermission('orders.create'),
    ],
    handler: handleCreateOrder,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/orders',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('orders-module'),
      requirePermission('orders.read'),
    ],
    handler: handleListOrders,
  },
];

