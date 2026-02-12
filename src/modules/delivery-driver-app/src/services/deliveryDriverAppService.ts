import type { DeliveryDriverAppLocationPayload, DeliveryDriverAppOrderDTO } from '@/src/types/delivery-driver-app';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import type { DeliveryRouteDTO } from '@/src/types/delivery-routes';
import type { OrdersOrderDTO } from '@/src/types/orders';
import { getOrder } from '../repositories/ordersRepository';
import { listAllRoutes, updateRoute } from '@/src/modules/delivery-routes/src/services/deliveryRoutesService';
import { listDeliveryDrivers, updateDeliveryDriver } from '@/src/modules/delivery-drivers/src/services/deliveryDriversService';

const DRIVER_APP_CHANNEL = 'delivery-driver-app';

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(DRIVER_APP_CHANNEL);
}

function notifyUpdate(payload: DeliveryDriverAppLocationPayload): void {
  const channel = getChannel();
  if (!channel) return;
  channel.postMessage(payload);
  channel.close();
}

function toDriverAppOrderDTO(order: OrdersOrderDTO): DeliveryDriverAppOrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    customerName: order.customerName ?? null,
    customerPhone: order.customerPhone ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function getDriverById(tenantSlug: string, driverId: string): DeliveryDriverDTO | null {
  const drivers = listDeliveryDrivers(tenantSlug);
  return drivers.find((driver) => driver.id === driverId) ?? null;
}

export async function getCurrentOrder(
  accessToken: string,
  orderId: string,
): Promise<DeliveryDriverAppOrderDTO> {
  const order = await getOrder(accessToken, orderId);
  return toDriverAppOrderDTO(order);
}

export function setDriverStatus(
  tenantSlug: string,
  driverId: string,
  input: { status: DeliveryDriverDTO['status']; activeOrderId?: string | null },
): DeliveryDriverDTO {
  return updateDeliveryDriver(tenantSlug, driverId, {
    status: input.status,
    activeOrderId: input.activeOrderId,
  });
}

function pickActiveRoute(
  routes: DeliveryRouteDTO[],
  driverId: string,
  activeOrderId: string | null,
): DeliveryRouteDTO | null {
  const active = routes.find(
    (route) =>
      route.status !== 'completed' &&
      (route.driverId === driverId ||
        (activeOrderId ? route.orderIds.includes(activeOrderId) : false)),
  );
  return active ?? null;
}

function toUpdateStops(route: DeliveryRouteDTO): Array<{
  orderId: string;
  latitude: number | null;
  longitude: number | null;
  label: string | null;
}> {
  return route.stops.map((stop) => ({
    orderId: stop.orderId,
    latitude: stop.latitude ?? null,
    longitude: stop.longitude ?? null,
    label: stop.label ?? null,
  }));
}

export async function refreshRouteEta(
  accessToken: string,
  tenantSlug: string,
  driverId: string,
  activeOrderId: string | null,
): Promise<DeliveryRouteDTO | null> {
  const routes = await listAllRoutes(tenantSlug);
  const route = pickActiveRoute(routes, driverId, activeOrderId);
  if (!route) return null;
  void accessToken;
  const updated = await updateRoute(tenantSlug, route.id, {
    status: route.status === 'completed' ? route.status : 'in_progress',
    driverId: route.driverId ?? driverId,
    orderIds: route.orderIds,
    stops: toUpdateStops(route),
  });
  return updated;
}

export async function updateDriverLocation(args: {
  tenantSlug: string;
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  tenantId: string;
  accessToken: string | null;
  activeOrderId: string | null;
}): Promise<DeliveryDriverDTO> {
  const updated = updateDeliveryDriver(args.tenantSlug, args.driverId, {
    latitude: args.latitude,
    longitude: args.longitude,
    lastLocationAt: args.timestamp,
  });

  if (args.accessToken) {
    await refreshRouteEta(args.accessToken, args.tenantSlug, args.driverId, args.activeOrderId);
  }

  notifyUpdate({
    latitude: args.latitude,
    longitude: args.longitude,
    timestamp: args.timestamp,
    driverId: args.driverId,
    tenantId: args.tenantId,
  });

  return updated;
}
