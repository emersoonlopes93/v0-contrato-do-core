import type {
  DeliveryRouteCreateRequest,
  DeliveryRouteDTO,
  DeliveryRouteOptimizationOptions,
  DeliveryRouteUpdateRequest,
} from '@/src/types/delivery-routes';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import { createRouteId, listRoutes, persistRoute, removeRoute } from '../repositories/deliveryRoutesRepository';
import { calculateDistanceMatrix } from '../repositories/distanceMatrixRepository';
import { fetchTenantSettings } from '../repositories/tenantSettingsRepository';
import { listDeliveryDrivers } from '@/src/modules/delivery-drivers/src/services/deliveryDriversService';
import { applyDeliveryPricingRoute } from '@/src/modules/delivery-pricing/src/repositories/deliveryPricingApiRepository';

type Coordinate = {
  latitude: number;
  longitude: number;
};

function computeTotals(route: DeliveryRouteDTO): DeliveryRouteDTO {
  const totalDistanceKm =
    route.stops.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0) || null;
  const totalEtaMinutes =
    route.stops.reduce((sum, s) => sum + (s.etaMinutes ?? 0), 0) || null;
  return { ...route, totalDistanceKm, totalEtaMinutes };
}

function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  stop: T,
): stop is T & Coordinate {
  return typeof stop.latitude === 'number' && typeof stop.longitude === 'number';
}

function isDriverWithCoordinates(
  driver: DeliveryDriverDTO,
): driver is DeliveryDriverDTO & Coordinate {
  return typeof driver.latitude === 'number' && typeof driver.longitude === 'number';
}

function toKm(value: number | null): number | null {
  if (!Number.isFinite(value)) return null;
  if (value === null) return null;
  return Math.round((value / 1000) * 100) / 100;
}

function toMinutes(value: number | null): number | null {
  if (!Number.isFinite(value)) return null;
  if (value === null) return null;
  return Math.round(value / 60);
}

async function findDriverOrigin(
  tenantSlug: string,
  orderIds: string[],
): Promise<Coordinate | null> {
  const drivers = await listDeliveryDrivers(tenantSlug);
  const candidate = drivers.find(
    (driver): driver is DeliveryDriverDTO & Coordinate =>
      driver.status !== 'offline' &&
      isDriverWithCoordinates(driver) &&
      (driver.activeOrderId ? orderIds.includes(driver.activeOrderId) : true),
  );
  if (!candidate) return null;
  return { latitude: candidate.latitude, longitude: candidate.longitude };
}

async function resolveOrigin(
  tenantSlug: string,
  stops: DeliveryRouteDTO['stops'],
  orderIds: string[],
): Promise<Coordinate | null> {
  const driverOrigin = await findDriverOrigin(tenantSlug, orderIds);
  if (driverOrigin) return driverOrigin;

  try {
    const settings = await fetchTenantSettings(tenantSlug);
    if (settings && typeof settings.latitude === 'number' && typeof settings.longitude === 'number') {
      return { latitude: settings.latitude, longitude: settings.longitude };
    }
  } catch {
    return null;
  }

  const firstStop = stops.find((stop) => hasCoordinates(stop));
  if (!firstStop) return null;
  return { latitude: firstStop.latitude, longitude: firstStop.longitude };
}

async function optimizeStops(
  tenantSlug: string,
  origin: Coordinate | null,
  stops: DeliveryRouteDTO['stops'],
  options?: DeliveryRouteOptimizationOptions,
): Promise<DeliveryRouteDTO['stops']> {
  if (!origin || stops.length <= 1) {
    return stops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
  }

  const remaining = stops.filter(hasCoordinates).map((stop) => ({ ...stop }));
  const invalidStops = stops.filter((stop) => !hasCoordinates(stop)).map((stop) => ({ ...stop }));
  if (remaining.length === 0) {
    return stops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
  }

  const preferDistance = options?.preferShortestDistance === true && options?.preferShortestTime !== true;
  const ordered: DeliveryRouteDTO['stops'] = [];
  let current: Coordinate = origin;

  while (remaining.length > 0) {
    const destinations = remaining.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }));
    const matrix = await calculateDistanceMatrix(tenantSlug, {
      origins: [current],
      destinations,
    });
    const row = matrix.rows[0];
    const elements = row?.elements ?? [];
    let bestIndex = 0;
    let bestMetric = Number.POSITIVE_INFINITY;

    elements.forEach((element, index) => {
      const metric = preferDistance ? element.distanceMeters : element.durationSeconds;
      if (metric === null || !Number.isFinite(metric)) return;
      if (metric < bestMetric) {
        bestMetric = metric;
        bestIndex = index;
      }
    });

    const next = remaining.splice(bestIndex, 1)[0];
    if (!next) break;
    ordered.push(next);
    current = { latitude: next.latitude, longitude: next.longitude };
  }

  const nextStops = [...ordered, ...remaining, ...invalidStops];
  return nextStops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
}

async function applyMetrics(
  tenantSlug: string,
  origin: Coordinate | null,
  stops: DeliveryRouteDTO['stops'],
): Promise<DeliveryRouteDTO['stops']> {
  if (!origin) {
    return stops.map((stop) => ({ ...stop, distanceKm: null, etaMinutes: null }));
  }

  const legs: Array<{ origin: Coordinate; destination: Coordinate; stopIndex: number }> = [];
  let previous: Coordinate | null = origin;

  stops.forEach((stop, index) => {
    if (!previous) return;
    if (!hasCoordinates(stop)) return;
    legs.push({
      origin: previous,
      destination: { latitude: stop.latitude, longitude: stop.longitude },
      stopIndex: index,
    });
    previous = { latitude: stop.latitude, longitude: stop.longitude };
  });

  if (legs.length === 0) {
    return stops.map((stop) => ({ ...stop, distanceKm: null, etaMinutes: null }));
  }

  const matrix = await calculateDistanceMatrix(tenantSlug, {
    origins: legs.map((leg) => leg.origin),
    destinations: legs.map((leg) => leg.destination),
  });

  const nextStops: DeliveryRouteDTO['stops'] = stops.map((stop) => ({
    ...stop,
    distanceKm: null,
    etaMinutes: null,
  }));

  legs.forEach((leg, index) => {
    const element = matrix.rows[index]?.elements[index];
    if (!element) return;
    const distanceKm = toKm(element.distanceMeters);
    const etaMinutes = toMinutes(element.durationSeconds);
    const current = nextStops[leg.stopIndex];
    if (!current) return;
    nextStops[leg.stopIndex] = {
      ...current,
      distanceKm,
      etaMinutes,
    };
  });

  return nextStops;
}

export async function createRoute(
  tenantSlug: string,
  input: DeliveryRouteCreateRequest,
  options?: DeliveryRouteOptimizationOptions,
): Promise<DeliveryRouteDTO> {
  const route: DeliveryRouteDTO = {
    id: createRouteId(),
    tenantId: tenantSlug,
    name: input.name,
    status: 'planned',
    driverId: null,
    orderIds: input.orderIds.slice(),
    stops: input.stops.map((s, index) => ({
      orderId: s.orderId,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      label: s.label ?? null,
      sequence: index + 1,
      distanceKm: null,
      etaMinutes: null,
    })),
    totalDistanceKm: null,
    totalEtaMinutes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const origin = await resolveOrigin(tenantSlug, route.stops, route.orderIds);
  const optimized = await optimizeStops(tenantSlug, origin, route.stops, options);
  const withMetrics = await applyMetrics(tenantSlug, origin, optimized);
  const nextRoute = computeTotals({
    ...route,
    stops: withMetrics,
  });
  const persisted = await persistRoute(tenantSlug, nextRoute);
  try {
    await applyDeliveryPricingRoute(tenantSlug, {
      routeId: persisted.id,
      stops: persisted.stops.map((stop) => ({
        orderId: stop.orderId,
        distanceKm: stop.distanceKm,
        etaMinutes: stop.etaMinutes,
      })),
    });
  } catch {
    return persisted;
  }
  return persisted;
}

export async function listAllRoutes(tenantSlug: string): Promise<DeliveryRouteDTO[]> {
  return await listRoutes(tenantSlug);
}

export async function updateRoute(
  tenantSlug: string,
  routeId: string,
  input: DeliveryRouteUpdateRequest,
): Promise<DeliveryRouteDTO> {
  const existing = (await listRoutes(tenantSlug)).find((r) => r.id === routeId);
  if (!existing) {
    throw new Error('Rota não encontrada');
  }
  const next: DeliveryRouteDTO = {
    ...existing,
    name: input.name ?? existing.name,
    status: input.status ?? existing.status,
    driverId: input.driverId ?? existing.driverId,
    orderIds: input.orderIds ?? existing.orderIds,
    stops:
      input.stops?.map((s, index) => ({
        orderId: s.orderId,
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        label: s.label ?? null,
        sequence: index + 1,
        distanceKm: null,
        etaMinutes: null,
      })) ?? existing.stops,
    updatedAt: new Date().toISOString(),
  };
  const origin = await resolveOrigin(tenantSlug, next.stops, next.orderIds);
  const optimized = await optimizeStops(tenantSlug, origin, next.stops);
  const withMetrics = await applyMetrics(tenantSlug, origin, optimized);
  const computed = computeTotals({ ...next, stops: withMetrics });
  const persisted = await persistRoute(tenantSlug, computed);
  try {
    await applyDeliveryPricingRoute(tenantSlug, {
      routeId: persisted.id,
      stops: persisted.stops.map((stop) => ({
        orderId: stop.orderId,
        distanceKm: stop.distanceKm,
        etaMinutes: stop.etaMinutes,
      })),
    });
  } catch {
    return persisted;
  }
  return persisted;
}

export async function deleteRoute(tenantSlug: string, routeId: string): Promise<void> {
  await removeRoute(tenantSlug, routeId);
}
