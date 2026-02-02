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
import type {
  OrdersCreateOrderRequest,
  OrdersServiceContract,
} from '@/src/types/orders';

function getOrdersService(): OrdersServiceContract | null {
  return globalModuleServiceRegistry.get<OrdersServiceContract>(
    asModuleId('orders-module'),
    'OrdersService',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isOrdersCreateOrderRequest(value: unknown): value is OrdersCreateOrderRequest {
  if (!isRecord(value)) return false;

  const source = value.source;
  const status = value.status;
  const total = value.total;
  const paymentMethod = value.paymentMethod;
  const customerName = value.customerName;
  const customerPhone = value.customerPhone;
  const deliveryType = value.deliveryType;
  const items = value.items;

  if (source !== undefined && !isString(source)) return false;
  if (status !== undefined && !isString(status)) return false;
  if (!isNumber(total)) return false;

  if (paymentMethod !== undefined && paymentMethod !== null && !isString(paymentMethod)) return false;
  if (customerName !== undefined && customerName !== null && !isString(customerName)) return false;
  if (customerPhone !== undefined && customerPhone !== null && !isString(customerPhone)) return false;
  if (deliveryType !== undefined && deliveryType !== null && !isString(deliveryType)) return false;

  if (!Array.isArray(items)) return false;

  for (const item of items) {
    if (!isRecord(item)) return false;
    if (!isString(item.name)) return false;
    if (!isNumber(item.quantity)) return false;
    if (!isNumber(item.unitPrice)) return false;
    if (!isNumber(item.totalPrice)) return false;
    if (item.notes !== undefined && item.notes !== null && !isString(item.notes)) return false;

    if (item.modifiers !== undefined) {
      if (!Array.isArray(item.modifiers)) return false;
      for (const mod of item.modifiers) {
        if (!isRecord(mod)) return false;
        if (!isString(mod.name)) return false;
        if (mod.priceDelta !== undefined && !isNumber(mod.priceDelta)) return false;
      }
    }
  }

  return true;
}

async function handleCreateOrder(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const body: unknown = req.body;

  if (!isOrdersCreateOrderRequest(body)) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Body inválido',
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
    const created = await ordersService.createOrder({
      tenantId: auth.tenantId,
      userId: auth.userId,
      input: body,
    });

    res.status = 201;
    res.body = {
      success: true,
      data: created,
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

async function handleGetOrder(req: Request, res: Response): Promise<void> {
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

  const orderId = req.params?.id;

  if (!orderId || typeof orderId !== 'string') {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Parâmetro "id" é obrigatório',
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
    const order = await ordersService.getOrderById(auth.tenantId, orderId);

    if (!order) {
      res.status = 404;
      res.body = {
        error: 'Not Found',
        message: 'Pedido não encontrado',
      };
      return;
    }

    res.status = 200;
    res.body = {
      success: true,
      data: order,
    };
  } catch (error) {
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get order',
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
  {
    method: 'GET',
    path: '/api/v1/tenant/orders/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('orders-module'),
      requirePermission('orders.read'),
    ],
    handler: handleGetOrder,
  },
];
