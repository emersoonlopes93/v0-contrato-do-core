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
import type { DistanceMatrixInput, DeliveryRouteDTO, DeliveryRoutesUpsertRequest } from '@/src/types/delivery-routes';
import { getMapsConfig } from '@/src/config/maps.config';
import { GoogleDistanceMatrixProvider } from './providers/googleDistanceMatrix.provider';
import { DeliveryRoutesApiService } from './services/deliveryRoutesApiService';

import { isRecord } from '@/src/core/utils/type-guards';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isCoordinate(value: unknown): value is { latitude: number; longitude: number } {
  return (
    isRecord(value) &&
    isNumber(value.latitude) &&
    isNumber(value.longitude)
  );
}

function isStop(value: unknown): value is DeliveryRouteDTO['stops'][number] {
  if (!isRecord(value)) return false;
  return (
    isString(value.orderId) &&
    isNullableNumber(value.latitude) &&
    isNullableNumber(value.longitude) &&
    isNullableString(value.label) &&
    isNumber(value.sequence) &&
    isNullableNumber(value.distanceKm) &&
    isNullableNumber(value.etaMinutes)
  );
}

function isRoute(value: unknown): value is DeliveryRouteDTO {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.tenantId) &&
    isString(value.name) &&
    isString(value.status) &&
    isNullableString(value.driverId) &&
    Array.isArray(value.orderIds) &&
    value.orderIds.every(isString) &&
    Array.isArray(value.stops) &&
    value.stops.every(isStop) &&
    isNullableNumber(value.totalDistanceKm) &&
    isNullableNumber(value.totalEtaMinutes) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function parseDistanceMatrixInput(
  value: unknown,
): { data: DistanceMatrixInput } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const origins = value.origins;
  const destinations = value.destinations;
  if (!Array.isArray(origins) || origins.length === 0) return { error: 'origins inválido' };
  if (!Array.isArray(destinations) || destinations.length === 0) return { error: 'destinations inválido' };
  if (!origins.every(isCoordinate)) return { error: 'origins inválido' };
  if (!destinations.every(isCoordinate)) return { error: 'destinations inválido' };
  return {
    data: {
      origins: origins.map((o) => ({ latitude: o.latitude, longitude: o.longitude })),
      destinations: destinations.map((d) => ({ latitude: d.latitude, longitude: d.longitude })),
    },
  };
}

function parseUpsertRequest(
  value: unknown,
): { data: DeliveryRoutesUpsertRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const route = value.route;
  if (!isRoute(route)) return { error: 'route inválido' };
  return { data: { route } };
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

function getService(): DeliveryRoutesApiService {
  return new DeliveryRoutesApiService();
}

async function handleCalculateMatrix(req: Request, res: Response): Promise<void> {
  if (!getAuth(req, res)) return;

  const parsed = parseDistanceMatrixInput(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const config = getMapsConfig();
    if (!config.googleDistanceMatrixApiKey) {
      res.status = 500;
      res.body = { error: 'Internal Server Error', message: 'Google Distance Matrix não configurado' };
      return;
    }
    const provider = new GoogleDistanceMatrixProvider();
    const data = await provider.calculateMatrix(parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao consultar Distance Matrix' };
  }
}

async function handleListRoutes(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  try {
    const service = getService();
    const routes = await service.listRoutes(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data: routes };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao listar rotas' };
  }
}

async function handleUpsertRoute(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const parsed = parseUpsertRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const service = getService();
    const saved = await service.upsertRoute(auth.tenantId, parsed.data.route);
    res.status = 200;
    res.body = { success: true, data: saved };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao salvar rota' };
  }
}

async function handleDeleteRoute(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const routeId = req.params?.routeId;
  if (!routeId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'routeId inválido' };
    return;
  }

  try {
    const service = getService();
    const removed = await service.deleteRoute(auth.tenantId, routeId);
    res.status = 200;
    res.body = { success: true, data: { removed } };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Falha ao remover rota' };
  }
}

export const deliveryRoutesTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-routes',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-routes'),
      requirePermission('delivery-routes.view'),
    ],
    handler: handleListRoutes,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-routes',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-routes'),
      requirePermission('delivery-routes.manage'),
    ],
    handler: handleUpsertRoute,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/delivery-routes/:routeId',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-routes'),
      requirePermission('delivery-routes.manage'),
    ],
    handler: handleDeleteRoute,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/delivery-routes/distance-matrix',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-routes'),
      requirePermission('delivery-routes.manage'),
    ],
    handler: handleCalculateMatrix,
  },
];
