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
import type { DistanceMatrixInput } from '@/src/types/delivery-routes';
import { getMapsConfig } from '@/src/config/maps.config';
import { GoogleDistanceMatrixProvider } from './providers/googleDistanceMatrix.provider';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCoordinate(value: unknown): value is { latitude: number; longitude: number } {
  return (
    isRecord(value) &&
    isNumber(value.latitude) &&
    isNumber(value.longitude)
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

export const deliveryRoutesTenantRoutes: Route[] = [
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
