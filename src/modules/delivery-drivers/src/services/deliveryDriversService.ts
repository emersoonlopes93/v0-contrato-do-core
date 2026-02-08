import type {
  DeliveryDriverAssignmentRequest,
  DeliveryDriverCreateRequest,
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverUpdateRequest,
} from '@/src/types/delivery-drivers';
import { appendHistoryEntry, createDriver, listDrivers, listHistory, updateDriver } from '../repositories/deliveryDriversRepository';

export function listDeliveryDrivers(tenantSlug: string): DeliveryDriverDTO[] {
  return listDrivers(tenantSlug);
}

export function listDeliveryDriverHistory(
  tenantSlug: string,
  driverId: string,
): DeliveryDriverHistoryEntryDTO[] {
  return listHistory(tenantSlug).filter((entry) => entry.driverId === driverId);
}

export function createDeliveryDriver(
  tenantSlug: string,
  input: DeliveryDriverCreateRequest,
): DeliveryDriverDTO {
  return createDriver(tenantSlug, {
    name: input.name,
    phone: input.phone ?? null,
  });
}

export function updateDeliveryDriver(
  tenantSlug: string,
  driverId: string,
  input: DeliveryDriverUpdateRequest,
): DeliveryDriverDTO {
  const payload: Partial<DeliveryDriverDTO> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.status !== undefined) payload.status = input.status;
  if (input.activeOrderId !== undefined) payload.activeOrderId = input.activeOrderId;
   if (input.latitude !== undefined) payload.latitude = input.latitude;
   if (input.longitude !== undefined) payload.longitude = input.longitude;
   if (input.lastLocationAt !== undefined) payload.lastLocationAt = input.lastLocationAt;
  return updateDriver(tenantSlug, driverId, payload);
}

export function assignDeliveryOrder(
  tenantSlug: string,
  input: DeliveryDriverAssignmentRequest,
): DeliveryDriverDTO {
  const nextStatus = input.orderId ? 'delivering' : undefined;
  const updated = updateDriver(tenantSlug, input.driverId, {
    activeOrderId: input.orderId,
    status: nextStatus,
  });
  if (input.orderId) {
    appendHistoryEntry(tenantSlug, {
      driverId: updated.id,
      orderId: input.orderId,
      status: 'delivering',
    });
  }
  return updated;
}

export function syncDriverWithOrderStatus(args: {
  tenantSlug: string;
  orderId: string;
  status: string;
}): DeliveryDriverDTO | null {
  const drivers = listDrivers(args.tenantSlug);
  const matched = drivers.find((d) => d.activeOrderId === args.orderId);
  if (!matched) return null;
  const shouldComplete = args.status === 'completed' || args.status === 'cancelled' || args.status === 'canceled';
  if (!shouldComplete) return null;
  const nextStatus = matched.status === 'offline' ? 'offline' : 'available';
  const updated = updateDriver(args.tenantSlug, matched.id, {
    activeOrderId: null,
    status: nextStatus,
    lastDeliveryAt: args.status === 'completed' ? new Date().toISOString() : matched.lastDeliveryAt,
  });
  appendHistoryEntry(args.tenantSlug, {
    driverId: updated.id,
    orderId: args.orderId,
    status: nextStatus,
  });
  return updated;
}
