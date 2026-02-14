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
  DeliverySettlementListRequest,
  DeliverySettlementSettingsCreateRequest,
} from '@/src/types/delivery-settlement';
import { DeliverySettlementService } from './services/deliverySettlementService';
import { DELIVERY_SETTLEMENT_PERMISSIONS } from './permissions';
import { isRecord } from '@/src/core/utils/type-guards';

const service = new DeliverySettlementService();

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

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function parseSettingsBody(value: unknown): DeliverySettlementSettingsCreateRequest | null {
  if (!isRecord(value)) return null;
  const {
    driverPercentage,
    driverFixedPerKm,
    driverMinimumAmount,
    driverMaximumAmount,
    storePercentage,
    platformPercentage,
  } = value;
  if (!isNumber(driverPercentage)) return null;
  if (!isNumber(driverFixedPerKm)) return null;
  if (!isNumber(driverMinimumAmount)) return null;
  if (driverMaximumAmount !== undefined && !isNullableNumber(driverMaximumAmount)) return null;
  if (!isNumber(storePercentage)) return null;
  if (!isNumber(platformPercentage)) return null;
  return {
    driverPercentage,
    driverFixedPerKm,
    driverMinimumAmount,
    driverMaximumAmount: driverMaximumAmount ?? null,
    storePercentage,
    platformPercentage,
  };
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function handleGetSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const data = await service.getSettings(auth.tenantId);
  res.status = 200;
  res.body = { success: true, data };
}

async function handleUpsertSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const input = parseSettingsBody(req.body);
  if (!input) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }
  const data = await service.upsertSettings(auth.tenantId, input);
  res.status = 200;
  res.body = { success: true, data };
}

async function handleList(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const page = typeof req.query?.page === 'string' ? Number(req.query.page) : 1;
  const limit = typeof req.query?.limit === 'string' ? Number(req.query.limit) : 20;

  const request: DeliverySettlementListRequest = {
    tenantId: auth.tenantId,
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 20,
    startDate: toNullableString(req.query?.startDate),
    endDate: toNullableString(req.query?.endDate),
    orderId: toNullableString(req.query?.orderId),
  };

  const data = await service.listSettlements(request);
  res.status = 200;
  res.body = { success: true, data };
}

async function handleGetByOrder(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const orderId = req.params?.orderId;
  if (!orderId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'orderId é obrigatório' };
    return;
  }
  const data = await service.getSettlementByOrderId(auth.tenantId, orderId);
  res.status = 200;
  res.body = { success: true, data };
}

export const deliverySettlementRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-settlement/settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-settlement'),
      requirePermission(DELIVERY_SETTLEMENT_PERMISSIONS.MANAGE_SETTINGS),
    ],
    handler: handleGetSettings,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/delivery-settlement/settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-settlement'),
      requirePermission(DELIVERY_SETTLEMENT_PERMISSIONS.MANAGE_SETTINGS),
    ],
    handler: handleUpsertSettings,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-settlement',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-settlement'),
      requirePermission(DELIVERY_SETTLEMENT_PERMISSIONS.VIEW_HISTORY),
    ],
    handler: handleList,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-settlement/:orderId',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-settlement'),
      requirePermission(DELIVERY_SETTLEMENT_PERMISSIONS.VIEW_SETTLEMENTS),
    ],
    handler: handleGetByOrder,
  },
];
