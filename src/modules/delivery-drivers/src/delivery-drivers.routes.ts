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
import type {
  DeliveryDriverCreateRequest,
  DeliveryDriverHistoryAppendRequest,
  DeliveryDriverUpdateRequest,
  DeliveryDriverStatus,
} from '@/src/types/delivery-drivers';
import { DeliveryDriversApiService } from './services/deliveryDriversApiService';
import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isDriverStatus(value: unknown): value is DeliveryDriverStatus {
  return value === 'available' || value === 'delivering' || value === 'offline';
}

function parseCreateRequest(value: unknown): { data: DeliveryDriverCreateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  if (!isString(value.name) || value.name.trim().length === 0) return { error: 'name inválido' };
  const phone = value.phone;
  if (phone !== undefined && !isNullableString(phone)) return { error: 'phone inválido' };
  return { data: { name: value.name, phone: phone ?? null } };
}

function parseUpdateRequest(value: unknown): { data: DeliveryDriverUpdateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const payload: DeliveryDriverUpdateRequest = {};
  if (value.name !== undefined) {
    if (!isString(value.name)) return { error: 'name inválido' };
    payload.name = value.name;
  }
  if (value.phone !== undefined) {
    if (!isNullableString(value.phone)) return { error: 'phone inválido' };
    payload.phone = value.phone;
  }
  if (value.status !== undefined) {
    if (!isDriverStatus(value.status)) return { error: 'status inválido' };
    payload.status = value.status;
  }
  if (value.activeOrderId !== undefined) {
    if (!isNullableString(value.activeOrderId)) return { error: 'activeOrderId inválido' };
    payload.activeOrderId = value.activeOrderId;
  }
  if (value.latitude !== undefined) {
    if (!isNullableNumber(value.latitude)) return { error: 'latitude inválido' };
    payload.latitude = value.latitude;
  }
  if (value.longitude !== undefined) {
    if (!isNullableNumber(value.longitude)) return { error: 'longitude inválido' };
    payload.longitude = value.longitude;
  }
  if (value.lastLocationAt !== undefined) {
    if (!isNullableString(value.lastLocationAt)) return { error: 'lastLocationAt inválido' };
    payload.lastLocationAt = value.lastLocationAt;
  }
  if (value.lastDeliveryAt !== undefined) {
    if (!isNullableString(value.lastDeliveryAt)) return { error: 'lastDeliveryAt inválido' };
    payload.lastDeliveryAt = value.lastDeliveryAt;
  }
  return { data: payload };
}

function parseHistoryAppendRequest(
  value: unknown,
): { data: DeliveryDriverHistoryAppendRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  if (!isString(value.driverId)) return { error: 'driverId inválido' };
  if (!isString(value.orderId)) return { error: 'orderId inválido' };
  if (!isDriverStatus(value.status)) return { error: 'status inválido' };
  return {
    data: {
      driverId: value.driverId,
      orderId: value.orderId,
      status: value.status,
    },
  };
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

function getService(): DeliveryDriversApiService {
  return new DeliveryDriversApiService();
}

async function handleListDrivers(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  try {
    const service = getService();
    const drivers = await service.listDrivers(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data: drivers };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao listar entregadores' };
  }
}

async function handleListHistory(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  try {
    const service = getService();
    const history = await service.listHistory(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data: history };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao listar histórico' };
  }
}

async function handleCreateDriver(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const parsed = parseCreateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const service = getService();
    const created = await service.createDriver(auth.tenantId, {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    });
    res.status = 200;
    res.body = { success: true, data: created };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao criar entregador' };
  }
}

async function handleUpdateDriver(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const driverId = req.params?.driverId;
  if (!driverId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'driverId inválido' };
    return;
  }

  const parsed = parseUpdateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const service = getService();
    const updated = await service.updateDriver(auth.tenantId, driverId, parsed.data);
    res.status = 200;
    res.body = { success: true, data: updated };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao atualizar entregador' };
  }
}

async function handleAppendHistory(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const parsed = parseHistoryAppendRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const service = getService();
    const created = await service.appendHistoryEntry(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data: created };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao registrar histórico' };
  }
}

export const deliveryDriversTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-drivers',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-drivers'),
      requirePermission('delivery-drivers.view'),
    ],
    handler: handleListDrivers,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-drivers/history',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-drivers'),
      requirePermission('delivery-drivers.view'),
    ],
    handler: handleListHistory,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-drivers',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-drivers'),
      requirePermission('delivery-drivers.manage'),
    ],
    handler: handleCreateDriver,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/delivery-drivers/:driverId',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-drivers'),
      requirePermission('delivery-drivers.manage'),
    ],
    handler: handleUpdateDriver,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-drivers/history',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-drivers'),
      requirePermission('delivery-drivers.assign'),
    ],
    handler: handleAppendHistory,
  },
];
