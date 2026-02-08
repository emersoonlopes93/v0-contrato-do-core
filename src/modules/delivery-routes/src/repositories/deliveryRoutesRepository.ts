import type { DeliveryRouteDTO } from '@/src/types/delivery-routes';

const STORAGE_KEY = 'delivery-routes:routes';

type StoragePayload = {
  routes: DeliveryRouteDTO[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isRoute(value: unknown): value is DeliveryRouteDTO {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.tenantId) &&
    isString(value.name) &&
    isString(value.status) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    Array.isArray(value.orderIds) &&
    Array.isArray(value.stops) &&
    isNullableNumber(value.totalDistanceKm) &&
    isNullableNumber(value.totalEtaMinutes)
  );
}

function parseRoutes(raw: string | null): DeliveryRouteDTO[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return [];
    const routes = (parsed as StoragePayload).routes;
    if (!Array.isArray(routes)) return [];
    return routes.filter(isRoute);
  } catch {
    return [];
  }
}

function storageKey(tenantSlug: string): string {
  return `${STORAGE_KEY}:${tenantSlug}`;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `route_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function saveRoutes(tenantSlug: string, routes: DeliveryRouteDTO[]): void {
  const payload: StoragePayload = { routes };
  window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(payload));
}

export function listRoutes(tenantSlug: string): DeliveryRouteDTO[] {
  return parseRoutes(window.localStorage.getItem(storageKey(tenantSlug)));
}

export function persistRoute(tenantSlug: string, route: DeliveryRouteDTO): DeliveryRouteDTO {
  const routes = listRoutes(tenantSlug);
  const existingIndex = routes.findIndex((r) => r.id === route.id);
  const next = [...routes];
  if (existingIndex >= 0) {
    next[existingIndex] = route;
  } else {
    next.unshift(route);
  }
  saveRoutes(tenantSlug, next);
  return route;
}

export function removeRoute(tenantSlug: string, routeId: string): void {
  const routes = listRoutes(tenantSlug).filter((route) => route.id !== routeId);
  saveRoutes(tenantSlug, routes);
}

export function createRouteId(): string {
  return generateId();
}
