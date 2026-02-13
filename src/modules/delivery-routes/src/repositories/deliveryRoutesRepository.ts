import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  DeliveryRouteDTO,
  DeliveryRoutesListResponse,
  DeliveryRoutesUpsertRequest,
  DeliveryRoutesUpsertResponse,
  DeliveryRoutesDeleteResponse,
} from '@/src/types/delivery-routes';

const STORAGE_KEY = 'delivery-routes:routes';

type StoragePayload = {
  routes: DeliveryRouteDTO[];
};

import { isRecord } from '@/src/core/utils/type-guards';

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

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function updateLocalRoutes(tenantSlug: string, route: DeliveryRouteDTO): void {
  const routes = parseRoutes(window.localStorage.getItem(storageKey(tenantSlug)));
  const existingIndex = routes.findIndex((r) => r.id === route.id);
  const next = [...routes];
  if (existingIndex >= 0) {
    next[existingIndex] = route;
  } else {
    next.unshift(route);
  }
  saveRoutes(tenantSlug, next);
}

export async function listRoutes(tenantSlug: string): Promise<DeliveryRouteDTO[]> {
  try {
    const routes = await requestJson<DeliveryRoutesListResponse>(
      '/api/v1/tenant/delivery-routes',
      tenantSlug,
    );
    saveRoutes(tenantSlug, routes);
    return routes;
  } catch {
    return parseRoutes(window.localStorage.getItem(storageKey(tenantSlug)));
  }
}

export async function persistRoute(tenantSlug: string, route: DeliveryRouteDTO): Promise<DeliveryRouteDTO> {
  const payload: DeliveryRoutesUpsertRequest = { route };
  try {
    const saved = await requestJson<DeliveryRoutesUpsertResponse>(
      '/api/v1/tenant/delivery-routes',
      tenantSlug,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    updateLocalRoutes(tenantSlug, saved);
    return saved;
  } catch {
    updateLocalRoutes(tenantSlug, route);
    return route;
  }
}

export async function removeRoute(tenantSlug: string, routeId: string): Promise<void> {
  try {
    const response = await requestJson<DeliveryRoutesDeleteResponse>(
      `/api/v1/tenant/delivery-routes/${encodeURIComponent(routeId)}`,
      tenantSlug,
      { method: 'DELETE' },
    );
    if (response.removed) {
      const routes = parseRoutes(window.localStorage.getItem(storageKey(tenantSlug))).filter(
        (route) => route.id !== routeId,
      );
      saveRoutes(tenantSlug, routes);
    }
  } catch {
    const routes = parseRoutes(window.localStorage.getItem(storageKey(tenantSlug))).filter(
      (route) => route.id !== routeId,
    );
    saveRoutes(tenantSlug, routes);
  }
}

export function createRouteId(): string {
  return generateId();
}
