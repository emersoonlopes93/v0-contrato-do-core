import { getPrismaClient } from '@/src/adapters/prisma/client';
import { isRecord, isString, isNumber } from '@/src/core/utils/type-guards';
import type { DeliveryRouteDTO, DeliveryRouteStopDTO } from '@/src/types/delivery-routes';

type DeliveryRouteRow = {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  driver_id: string | null;
  order_ids: unknown;
  stops: unknown;
  total_distance_km: number | null;
  total_eta_minutes: number | null;
  created_at: Date;
  updated_at: Date;
};

function isNullableNumber(value: unknown): value is number | null {
  return typeof value === 'number' || value === null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isStop(value: unknown): value is DeliveryRouteStopDTO {
  if (!isRecord(value)) return false;
  return (
    isString(value.orderId) &&
    isNullableNumber(value.latitude) &&
    isNullableNumber(value.longitude) &&
    (value.label === null || isString(value.label)) &&
    isNumber(value.sequence) &&
    isNullableNumber(value.distanceKm) &&
    isNullableNumber(value.etaMinutes)
  );
}

function toStops(value: unknown): DeliveryRouteStopDTO[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStop);
}

export class DeliveryRoutesDbRepository {
  private prisma = getPrismaClient();

  async listByTenantId(tenantId: string): Promise<DeliveryRouteDTO[]> {
    const rows = await this.prisma.deliveryRoute.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((row) => this.toDTO(row as unknown as DeliveryRouteRow));
  }

  async upsertRoute(tenantId: string, route: DeliveryRouteDTO): Promise<DeliveryRouteDTO> {
    const existing = await this.prisma.deliveryRoute.findFirst({
      where: { id: route.id, tenant_id: tenantId },
      select: { id: true },
    });

    const data = {
      name: route.name,
      status: route.status,
      driver_id: route.driverId,
      order_ids: route.orderIds,
      stops: route.stops,
      total_distance_km: route.totalDistanceKm,
      total_eta_minutes: route.totalEtaMinutes,
    };

    const row = existing
      ? await this.prisma.deliveryRoute.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.deliveryRoute.create({
          data: {
            id: route.id,
            tenant_id: tenantId,
            ...data,
          },
        });

    return this.toDTO(row as unknown as DeliveryRouteRow);
  }

  async deleteRoute(tenantId: string, routeId: string): Promise<boolean> {
    const existing = await this.prisma.deliveryRoute.findFirst({
      where: { id: routeId, tenant_id: tenantId },
      select: { id: true },
    });
    if (!existing) return false;
    await this.prisma.deliveryRoute.delete({ where: { id: existing.id } });
    return true;
  }

  private toDTO(row: DeliveryRouteRow): DeliveryRouteDTO {
    const orderIds = isStringArray(row.order_ids) ? row.order_ids : [];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      status: row.status as DeliveryRouteDTO['status'],
      driverId: row.driver_id ?? null,
      orderIds,
      stops: toStops(row.stops),
      totalDistanceKm: row.total_distance_km ?? null,
      totalEtaMinutes: row.total_eta_minutes ?? null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
