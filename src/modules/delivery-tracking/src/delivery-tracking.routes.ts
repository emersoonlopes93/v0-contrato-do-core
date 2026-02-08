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
import { getMapsConfig } from '@/src/config/maps.config';
import type { DeliveryTrackingMapConfig } from '@/src/types/delivery-tracking';

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

async function handleMapConfig(req: Request, res: Response): Promise<void> {
  if (!getAuth(req, res)) return;

  const config = getMapsConfig();
  let googleMapsScript: string | null = null;
  if (config.googleMapsApiKey) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/js');
      url.searchParams.set('key', config.googleMapsApiKey);
      const response = await fetch(url.toString());
      if (!response.ok) {
        res.status = 502;
        res.body = { error: 'Bad Gateway', message: 'Falha ao carregar Google Maps' };
        return;
      }
      googleMapsScript = await response.text();
    } catch (error) {
      res.status = 502;
      res.body = { error: 'Bad Gateway', message: error instanceof Error ? error.message : 'Falha ao carregar Google Maps' };
      return;
    }
  }

  const data: DeliveryTrackingMapConfig = {
    googleMapsScript,
    googleMapsMapId: config.googleMapsMapId,
  };
  res.status = 200;
  res.body = { success: true, data };
}

export const deliveryTrackingTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/delivery-tracking/map-config',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('delivery-tracking'),
      requirePermission('delivery-tracking.view'),
    ],
    handler: handleMapConfig,
  },
];
