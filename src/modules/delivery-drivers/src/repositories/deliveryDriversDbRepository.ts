import { getPrismaClient } from '@/src/adapters/prisma/client';
import { isRecord, isString } from '@/src/core/utils/type-guards';
import type {
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverStatus,
} from '@/src/types/delivery-drivers';

type DeliveryDriverRow = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  status: string;
  active_order_id: string | null;
  latitude: number | null;
  longitude: number | null;
  last_location_at: Date | null;
  last_delivery_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type DriverHistoryRow = {
  id: string;
  tenant_id: string;
  driver_id: string;
  order_id: string;
  status: string;
  timestamp: Date;
};

function isDriverStatus(value: unknown): value is DeliveryDriverStatus {
  return value === 'available' || value === 'delivering' || value === 'offline';
}

function isHistoryRow(value: unknown): value is DriverHistoryRow {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.tenant_id) &&
    isString(value.driver_id) &&
    isString(value.order_id) &&
    isString(value.status) &&
    value.timestamp instanceof Date
  );
}

export class DeliveryDriversDbRepository {
  private prisma = getPrismaClient();

  async listByTenantId(tenantId: string): Promise<DeliveryDriverDTO[]> {
    const rows = await this.prisma.deliveryDriver.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((row) => this.toDTO(row as unknown as DeliveryDriverRow));
  }

  async listHistoryByTenantId(tenantId: string): Promise<DeliveryDriverHistoryEntryDTO[]> {
    const rows = await this.prisma.driverStatusHistory.findMany({
      where: { tenant_id: tenantId },
      orderBy: { timestamp: 'desc' },
    });
    return rows
      .filter((row) => isHistoryRow(row))
      .map((row) => this.toHistoryDTO(row));
  }

  async createDriver(tenantId: string, input: { name: string; phone: string | null }): Promise<DeliveryDriverDTO> {
    const row = await this.prisma.deliveryDriver.create({
      data: {
        tenant_id: tenantId,
        name: input.name,
        phone: input.phone,
        status: 'offline',
        active_order_id: null,
        latitude: null,
        longitude: null,
        last_location_at: null,
        last_delivery_at: null,
      },
    });
    return this.toDTO(row as unknown as DeliveryDriverRow);
  }

  async updateDriver(
    tenantId: string,
    driverId: string,
    input: Partial<{
      name: string;
      phone: string | null;
      status: DeliveryDriverStatus;
      activeOrderId: string | null;
      latitude: number | null;
      longitude: number | null;
      lastLocationAt: string | null;
      lastDeliveryAt: string | null;
    }>,
  ): Promise<DeliveryDriverDTO> {
    const existing = await this.prisma.deliveryDriver.findFirst({
      where: { id: driverId, tenant_id: tenantId },
      select: { id: true },
    });
    if (!existing) {
      throw new Error('Entregador não encontrado');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryDriver.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          phone: input.phone,
          status: input.status,
          active_order_id: input.activeOrderId,
          latitude: input.latitude,
          longitude: input.longitude,
          last_location_at: input.lastLocationAt ? new Date(input.lastLocationAt) : input.lastLocationAt,
          last_delivery_at: input.lastDeliveryAt ? new Date(input.lastDeliveryAt) : input.lastDeliveryAt,
        },
      });

      if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
        await tx.driverPosition.create({
          data: {
            tenant_id: tenantId,
            driver_id: updated.id,
            latitude: input.latitude,
            longitude: input.longitude,
            recorded_at: input.lastLocationAt ? new Date(input.lastLocationAt) : new Date(),
          },
        });
      }

      return updated;
    });

    return this.toDTO(result as unknown as DeliveryDriverRow);
  }

  async appendHistoryEntry(
    tenantId: string,
    input: { driverId: string; orderId: string; status: DeliveryDriverStatus },
  ): Promise<DeliveryDriverHistoryEntryDTO> {
    const row = await this.prisma.driverStatusHistory.create({
      data: {
        tenant_id: tenantId,
        driver_id: input.driverId,
        order_id: input.orderId,
        status: input.status,
      },
    });
    return this.toHistoryDTO(row as unknown as DriverHistoryRow);
  }

  private toDTO(row: DeliveryDriverRow): DeliveryDriverDTO {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      phone: row.phone,
      status: isDriverStatus(row.status) ? row.status : 'offline',
      activeOrderId: row.active_order_id,
      latitude: row.latitude,
      longitude: row.longitude,
      lastLocationAt: row.last_location_at ? row.last_location_at.toISOString() : null,
      lastDeliveryAt: row.last_delivery_at ? row.last_delivery_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private toHistoryDTO(row: DriverHistoryRow): DeliveryDriverHistoryEntryDTO {
    return {
      id: row.id,
      driverId: row.driver_id,
      orderId: row.order_id,
      status: isDriverStatus(row.status) ? row.status : 'offline',
      timestamp: row.timestamp.toISOString(),
    };
  }
}
