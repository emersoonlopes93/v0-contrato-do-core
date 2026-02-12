import {
  errorHandler,
  requestLogger,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { prisma } from '@/src/adapters/prisma/client';
import { tenantModuleService } from '@/src/adapters/prisma/modules/tenant-module.service';
import { asModuleId, asUUID } from '@/src/core/types';
import { getMapsConfig } from '@/src/config/maps.config';
import type { ClientTrackingMapConfig, ClientTrackingSnapshot } from '@/src/types/client-tracking';
import { GoogleDistanceMatrixProvider } from '@/src/modules/delivery-routes/src/providers/googleDistanceMatrix.provider';
import { resolveTrackingToken } from './services/clientTrackingTokenService';

import { isRecord } from '@/src/core/utils/type-guards';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function parseDeliveryInfo(value: unknown): {
  customerLatitude: number | null;
  customerLongitude: number | null;
  driverLatitude: number | null;
  driverLongitude: number | null;
  driverUpdatedAt: string | null;
  etaMinutes: number | null;
} {
  if (!isRecord(value)) {
    return {
      customerLatitude: null,
      customerLongitude: null,
      driverLatitude: null,
      driverLongitude: null,
      driverUpdatedAt: null,
      etaMinutes: null,
    };
  }
  return {
    customerLatitude: isNumber(value.customerLatitude) ? value.customerLatitude : null,
    customerLongitude: isNumber(value.customerLongitude) ? value.customerLongitude : null,
    driverLatitude: isNumber(value.driverLatitude) ? value.driverLatitude : null,
    driverLongitude: isNumber(value.driverLongitude) ? value.driverLongitude : null,
    driverUpdatedAt: isNullableString(value.driverUpdatedAt) ? value.driverUpdatedAt : null,
    etaMinutes: isNumber(value.etaMinutes) ? value.etaMinutes : null,
  };
}

function resolveTrackingStatus(orderStatus: string, etaMinutes: number | null): {
  status: ClientTrackingSnapshot['status'];
  statusLabel: string;
  message: string;
} {
  if (orderStatus === 'completed' || orderStatus === 'delivered') {
    return { status: 'delivered', statusLabel: 'Entregue', message: 'Pedido entregue' };
  }
  if (etaMinutes !== null && etaMinutes <= 5) {
    return { status: 'near', statusLabel: 'Próximo', message: 'Seu pedido está próximo' };
  }
  if (orderStatus === 'delivering') {
    return { status: 'in_route', statusLabel: 'Em rota', message: 'Seu pedido saiu para entrega' };
  }
  return { status: 'preparing', statusLabel: 'Preparando', message: 'Seu pedido está sendo preparado' };
}

async function resolveEta(args: {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  fallback: number | null;
}): Promise<number | null> {
  if (!args.origin || !args.destination) return args.fallback;
  try {
    const provider = new GoogleDistanceMatrixProvider();
    const matrix = await provider.calculateMatrix({
      origins: [args.origin],
      destinations: [args.destination],
    });
    const value = matrix.rows[0]?.elements[0]?.durationSeconds;
    if (typeof value !== 'number') return args.fallback;
    return Math.max(1, Math.round(value / 60));
  } catch {
    return args.fallback;
  }
}

async function handleTrackingSnapshot(req: Request, res: Response): Promise<void> {
  const token = req.params?.token;
  if (!token) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Token inválido' };
    return;
  }

  const trackingToken = await resolveTrackingToken(token);
  if (!trackingToken) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Tracking não encontrado' };
    return;
  }

  const [tenant, order] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: trackingToken.tenantId },
      select: { id: true, slug: true, status: true },
    }),
    prisma.order.findFirst({
      where: { id: trackingToken.orderId, tenant_id: trackingToken.tenantId },
      select: {
        id: true,
        status: true,
        public_order_code: true,
        delivery_info: true,
        updated_at: true,
      },
    }),
  ]);

  if (!tenant || tenant.status !== 'active' || !order) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Tracking não encontrado' };
    return;
  }

  const enabled = await tenantModuleService.isEnabled(
    asUUID(tenant.id),
    asModuleId('client-tracking'),
  );
  if (!enabled) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Tracking indisponível' };
    return;
  }

  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenant_id: tenant.id },
    select: { trade_name: true, latitude: true, longitude: true },
  });

  const deliveryInfo = parseDeliveryInfo(order.delivery_info);
  const restaurantLocation =
    typeof tenantSettings?.latitude === 'number' && typeof tenantSettings?.longitude === 'number'
      ? {
          latitude: tenantSettings.latitude,
          longitude: tenantSettings.longitude,
          label: tenantSettings.trade_name ?? 'Restaurante',
        }
      : null;

  const customerLocation =
    typeof deliveryInfo.customerLatitude === 'number' &&
    typeof deliveryInfo.customerLongitude === 'number'
      ? {
          latitude: deliveryInfo.customerLatitude,
          longitude: deliveryInfo.customerLongitude,
          label: 'Cliente',
        }
      : null;

  const driverLocation =
    typeof deliveryInfo.driverLatitude === 'number' &&
    typeof deliveryInfo.driverLongitude === 'number'
      ? {
          latitude: deliveryInfo.driverLatitude,
          longitude: deliveryInfo.driverLongitude,
          lastUpdateAt: deliveryInfo.driverUpdatedAt,
        }
      : null;

  const origin = driverLocation
    ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
    : restaurantLocation
      ? { latitude: restaurantLocation.latitude, longitude: restaurantLocation.longitude }
      : null;
  const destination = customerLocation
    ? { latitude: customerLocation.latitude, longitude: customerLocation.longitude }
    : null;

  const etaMinutes = await resolveEta({
    origin,
    destination,
    fallback: deliveryInfo.etaMinutes,
  });

  const status = resolveTrackingStatus(order.status, etaMinutes);

  const data: ClientTrackingSnapshot = {
    tenantSlug: tenant.slug,
    orderId: order.id,
    publicOrderCode: order.public_order_code ?? order.id,
    status: status.status,
    statusLabel: status.statusLabel,
    message: status.message,
    etaMinutes,
    restaurant: restaurantLocation,
    customer: customerLocation,
    driver: driverLocation,
    updatedAt: order.updated_at.toISOString(),
  };

  res.status = 200;
  res.body = { success: true, data };
}

async function handleMapConfig(req: Request, res: Response): Promise<void> {
  const token = req.params?.token;
  if (!token) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Token inválido' };
    return;
  }
  const trackingToken = await resolveTrackingToken(token);
  if (!trackingToken) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Tracking não encontrado' };
    return;
  }

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

  const data: ClientTrackingMapConfig = {
    googleMapsScript,
    googleMapsMapId: config.googleMapsMapId,
  };
  res.status = 200;
  res.body = { success: true, data };
}

export const clientTrackingPublicRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/public/track/:token',
    middlewares: [requestLogger, errorHandler],
    handler: handleTrackingSnapshot,
  },
  {
    method: 'GET',
    path: '/api/v1/public/track/:token/map-config',
    middlewares: [requestLogger, errorHandler],
    handler: handleMapConfig,
  },
];
