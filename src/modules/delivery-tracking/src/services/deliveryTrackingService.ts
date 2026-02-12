import type { DeliveryTrackingDriverStatus, DeliveryTrackingSnapshot } from '@/src/types/delivery-tracking';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import type { DeliveryRouteDTO } from '@/src/types/delivery-routes';
import { loadDeliveryTrackingData } from '../repositories/deliveryTrackingRepository';
import { fetchTenantSettings } from '../repositories/tenantSettingsRepository';

function toTrackingDriverStatus(driver: DeliveryDriverDTO): DeliveryTrackingDriverStatus {
  if (driver.status === 'offline') return 'offline';
  if (driver.activeOrderId) return 'in_route';
  return 'stopped';
}

function mapDrivers(drivers: DeliveryDriverDTO[]) {
  return drivers.map((driver) => ({
    driverId: driver.id,
    name: driver.name,
    status: toTrackingDriverStatus(driver),
    activeOrderId: driver.activeOrderId,
    latitude: driver.latitude,
    longitude: driver.longitude,
    lastLocationAt: driver.lastLocationAt,
    lastUpdateAt: driver.updatedAt,
  }));
}

function mapRoutes(routes: DeliveryRouteDTO[]) {
  return routes.map((route) => ({
    routeId: route.id,
    name: route.name,
    status: route.status,
    orderIds: route.orderIds.slice(),
    stops: route.stops.map((stop) => ({
      orderId: stop.orderId,
      latitude: stop.latitude,
      longitude: stop.longitude,
      label: stop.label,
      sequence: stop.sequence,
      distanceKm: stop.distanceKm,
      etaMinutes: stop.etaMinutes,
    })),
    totalDistanceKm: route.totalDistanceKm,
    totalEtaMinutes: route.totalEtaMinutes,
    active: route.status === 'in_progress',
    etaMinutes: route.totalEtaMinutes,
  }));
}

export async function getDeliveryTrackingSnapshot(
  tenantSlug: string,
): Promise<DeliveryTrackingSnapshot> {
  const { drivers, routes } = await loadDeliveryTrackingData(tenantSlug);
  let restaurant: DeliveryTrackingSnapshot['restaurant'] = null;
  try {
    const settings = await fetchTenantSettings(tenantSlug);
    if (settings) {
      restaurant = {
        latitude: settings.latitude,
        longitude: settings.longitude,
        label: settings.tradeName,
      };
    }
  } catch {
    restaurant = null;
  }
  return {
    drivers: mapDrivers(drivers),
    routes: mapRoutes(routes),
    restaurant,
    updatedAt: new Date().toISOString(),
  };
}
