import type {
  DeliveryDriverAssignmentRequest,
  DeliveryDriverCreateRequest,
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverUpdateRequest,
} from '@/src/types/delivery-drivers';
import { appendHistoryEntry, createDriver, listDrivers, listHistory, updateDriver } from '../repositories/deliveryDriversRepository';

export async function listDeliveryDrivers(tenantSlug: string): Promise<DeliveryDriverDTO[]> {
  return await listDrivers(tenantSlug);
}

export async function listDeliveryDriverHistory(
  tenantSlug: string,
  driverId: string,
): Promise<DeliveryDriverHistoryEntryDTO[]> {
  const history = await listHistory(tenantSlug);
  return history.filter((entry) => entry.driverId === driverId);
}

export async function createDeliveryDriver(
  tenantSlug: string,
  input: DeliveryDriverCreateRequest,
): Promise<DeliveryDriverDTO> {
  return await createDriver(tenantSlug, {
    name: input.name,
    phone: input.phone ?? null,
  });
}

export async function updateDeliveryDriver(
  tenantSlug: string,
  driverId: string,
  input: DeliveryDriverUpdateRequest,
): Promise<DeliveryDriverDTO> {
  const payload: Partial<DeliveryDriverDTO> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.status !== undefined) payload.status = input.status;
  if (input.activeOrderId !== undefined) payload.activeOrderId = input.activeOrderId;
  if (input.latitude !== undefined) payload.latitude = input.latitude;
  if (input.longitude !== undefined) payload.longitude = input.longitude;
  if (input.lastLocationAt !== undefined) payload.lastLocationAt = input.lastLocationAt;
  return await updateDriver(tenantSlug, driverId, payload);
}

export async function assignDeliveryOrder(
  tenantSlug: string,
  input: DeliveryDriverAssignmentRequest,
): Promise<DeliveryDriverDTO> {
  const nextStatus = input.orderId ? 'delivering' : undefined;
  const updated = await updateDriver(tenantSlug, input.driverId, {
    activeOrderId: input.orderId,
    status: nextStatus,
  });
  if (input.orderId) {
    await appendHistoryEntry(tenantSlug, {
      driverId: updated.id,
      orderId: input.orderId,
      status: 'delivering',
    });
  }
  return updated;
}

export async function syncDriverWithOrderStatus(args: {
  tenantSlug: string;
  orderId: string;
  status: string;
}): Promise<DeliveryDriverDTO | null> {
  const drivers = await listDrivers(args.tenantSlug);
  const matched = drivers.find((d) => d.activeOrderId === args.orderId);
  if (!matched) return null;
  const shouldComplete = args.status === 'completed' || args.status === 'cancelled' || args.status === 'canceled';
  if (!shouldComplete) return null;
  const nextStatus = matched.status === 'offline' ? 'offline' : 'available';
  const updated = await updateDriver(args.tenantSlug, matched.id, {
    activeOrderId: null,
    status: nextStatus,
    lastDeliveryAt: args.status === 'completed' ? new Date().toISOString() : matched.lastDeliveryAt,
  });
  await appendHistoryEntry(args.tenantSlug, {
    driverId: updated.id,
    orderId: args.orderId,
    status: nextStatus,
  });
  return updated;
}
