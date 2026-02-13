import type {
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverHistoryAppendRequest,
  DeliveryDriverHistoryAppendResponse,
  DeliveryDriverStatus,
  DeliveryDriversHistoryListResponse,
  DeliveryDriversListResponse,
} from '@/src/types/delivery-drivers';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';

const STORAGE_KEY = 'delivery-drivers:drivers';
const HISTORY_KEY = 'delivery-drivers:history';

type StoragePayload = {
  drivers: DeliveryDriverDTO[];
};

type HistoryPayload = {
  history: DeliveryDriverHistoryEntryDTO[];
};

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isDriverStatus(value: unknown): value is DeliveryDriverStatus {
  return value === 'available' || value === 'delivering' || value === 'offline';
}

function isDriverDTO(value: unknown): value is DeliveryDriverDTO {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.tenantId) &&
    isString(value.name) &&
    isNullableString(value.phone) &&
    isDriverStatus(value.status) &&
    isNullableString(value.activeOrderId) &&
    isNullableNumber((value as { latitude: unknown }).latitude) &&
    isNullableNumber((value as { longitude: unknown }).longitude) &&
    isNullableString((value as { lastLocationAt: unknown }).lastLocationAt) &&
    isNullableString(value.lastDeliveryAt) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function parseDrivers(raw: string | null): DeliveryDriverDTO[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return [];
    const drivers = (parsed as StoragePayload).drivers;
    if (!Array.isArray(drivers)) return [];
    return drivers.filter(isDriverDTO);
  } catch {
    return [];
  }
}

function parseHistory(raw: string | null): DeliveryDriverHistoryEntryDTO[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return [];
    const history = (parsed as HistoryPayload).history;
    if (!Array.isArray(history)) return [];
    return history.filter((entry): entry is DeliveryDriverHistoryEntryDTO => {
      if (!isRecord(entry)) return false;
      return (
        isString(entry.id) &&
        isString(entry.driverId) &&
        isString(entry.orderId) &&
        isDriverStatus(entry.status) &&
        isString(entry.timestamp)
      );
    });
  } catch {
    return [];
  }
}

function storageKey(tenantSlug: string): string {
  return `${STORAGE_KEY}:${tenantSlug}`;
}

function historyKey(tenantSlug: string): string {
  return `${HISTORY_KEY}:${tenantSlug}`;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `drv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function saveDrivers(tenantSlug: string, drivers: DeliveryDriverDTO[]): void {
  const payload: StoragePayload = { drivers };
  window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(payload));
}

function saveHistory(tenantSlug: string, history: DeliveryDriverHistoryEntryDTO[]): void {
  const payload: HistoryPayload = { history };
  window.localStorage.setItem(historyKey(tenantSlug), JSON.stringify(payload));
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

function updateLocalDrivers(tenantSlug: string, driver: DeliveryDriverDTO): void {
  const drivers = parseDrivers(window.localStorage.getItem(storageKey(tenantSlug)));
  const index = drivers.findIndex((d) => d.id === driver.id);
  const next = [...drivers];
  if (index >= 0) {
    next[index] = driver;
  } else {
    next.push(driver);
  }
  saveDrivers(tenantSlug, next);
}

function appendLocalHistory(tenantSlug: string, entry: DeliveryDriverHistoryEntryDTO): void {
  const history = parseHistory(window.localStorage.getItem(historyKey(tenantSlug)));
  const next = [entry, ...history].slice(0, 200);
  saveHistory(tenantSlug, next);
}

export async function listDrivers(tenantSlug: string): Promise<DeliveryDriverDTO[]> {
  try {
    const drivers = await requestJson<DeliveryDriversListResponse>(
      '/api/v1/tenant/delivery-drivers',
      tenantSlug,
    );
    saveDrivers(tenantSlug, drivers);
    return drivers;
  } catch {
    return parseDrivers(window.localStorage.getItem(storageKey(tenantSlug)));
  }
}

export async function listHistory(tenantSlug: string): Promise<DeliveryDriverHistoryEntryDTO[]> {
  try {
    const history = await requestJson<DeliveryDriversHistoryListResponse>(
      '/api/v1/tenant/delivery-drivers/history',
      tenantSlug,
    );
    saveHistory(tenantSlug, history);
    return history;
  } catch {
    return parseHistory(window.localStorage.getItem(historyKey(tenantSlug)));
  }
}

export async function createDriver(
  tenantSlug: string,
  input: { name: string; phone: string | null },
): Promise<DeliveryDriverDTO> {
  try {
    const created = await requestJson<DeliveryDriverDTO>(
      '/api/v1/tenant/delivery-drivers',
      tenantSlug,
      { method: 'POST', body: JSON.stringify(input) },
    );
    updateLocalDrivers(tenantSlug, created);
    return created;
  } catch {
    const now = new Date().toISOString();
    const driver: DeliveryDriverDTO = {
      id: generateId(),
      tenantId: tenantSlug,
      name: input.name,
      phone: input.phone,
      status: 'offline',
      activeOrderId: null,
      latitude: null,
      longitude: null,
      lastLocationAt: null,
      lastDeliveryAt: null,
      createdAt: now,
      updatedAt: now,
    };
    updateLocalDrivers(tenantSlug, driver);
    return driver;
  }
}

export async function updateDriver(
  tenantSlug: string,
  driverId: string,
  input: Partial<
    Pick<
      DeliveryDriverDTO,
      | 'name'
      | 'phone'
      | 'status'
      | 'activeOrderId'
      | 'latitude'
      | 'longitude'
      | 'lastLocationAt'
      | 'lastDeliveryAt'
    >
  >,
): Promise<DeliveryDriverDTO> {
  try {
    const updated = await requestJson<DeliveryDriverDTO>(
      `/api/v1/tenant/delivery-drivers/${encodeURIComponent(driverId)}`,
      tenantSlug,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    updateLocalDrivers(tenantSlug, updated);
    return updated;
  } catch {
    const drivers = parseDrivers(window.localStorage.getItem(storageKey(tenantSlug)));
    const index = drivers.findIndex((d) => d.id === driverId);
    if (index < 0) {
      throw new Error('Entregador não encontrado');
    }
    const current = drivers[index];
    if (!current) {
      throw new Error('Entregador não encontrado');
    }
    const updated: DeliveryDriverDTO = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    updateLocalDrivers(tenantSlug, updated);
    return updated;
  }
}

export async function appendHistoryEntry(
  tenantSlug: string,
  entry: Omit<DeliveryDriverHistoryEntryDTO, 'id' | 'timestamp'>,
): Promise<DeliveryDriverHistoryEntryDTO> {
  const payload: DeliveryDriverHistoryAppendRequest = {
    driverId: entry.driverId,
    orderId: entry.orderId,
    status: entry.status,
  };
  try {
    const created = await requestJson<DeliveryDriverHistoryAppendResponse>(
      '/api/v1/tenant/delivery-drivers/history',
      tenantSlug,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    appendLocalHistory(tenantSlug, created);
    return created;
  } catch {
    const created: DeliveryDriverHistoryEntryDTO = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    appendLocalHistory(tenantSlug, created);
    return created;
  }
}
