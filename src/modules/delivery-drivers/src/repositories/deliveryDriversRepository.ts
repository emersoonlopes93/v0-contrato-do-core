import type {
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverStatus,
} from '@/src/types/delivery-drivers';

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

export function listDrivers(tenantSlug: string): DeliveryDriverDTO[] {
  return parseDrivers(window.localStorage.getItem(storageKey(tenantSlug)));
}

export function listHistory(tenantSlug: string): DeliveryDriverHistoryEntryDTO[] {
  return parseHistory(window.localStorage.getItem(historyKey(tenantSlug)));
}

export function createDriver(
  tenantSlug: string,
  input: { name: string; phone: string | null },
): DeliveryDriverDTO {
  const now = new Date().toISOString();
  const drivers = listDrivers(tenantSlug);
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
  const next = [...drivers, driver];
  saveDrivers(tenantSlug, next);
  return driver;
}

export function updateDriver(
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
): DeliveryDriverDTO {
  const drivers = listDrivers(tenantSlug);
  const index = drivers.findIndex((d) => d.id === driverId);
  if (index < 0) {
    throw new Error('Entregador não encontrado');
  }
  const current = drivers[index];
  const updated: DeliveryDriverDTO = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  const next = [...drivers];
  next[index] = updated;
  saveDrivers(tenantSlug, next);
  return updated;
}

export function appendHistoryEntry(
  tenantSlug: string,
  entry: Omit<DeliveryDriverHistoryEntryDTO, 'id' | 'timestamp'>,
): DeliveryDriverHistoryEntryDTO {
  const history = listHistory(tenantSlug);
  const created: DeliveryDriverHistoryEntryDTO = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const next = [created, ...history].slice(0, 200);
  saveHistory(tenantSlug, next);
  return created;
}
