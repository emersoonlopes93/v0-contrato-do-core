import type {
  DeliverySettlementDTO,
  DeliverySettlementSettingsDTO,
  DeliverySettlementSettingsCreateRequest,
  DeliverySettlementSettingsUpdateRequest,
  DeliverySettlementListRequest,
  DeliverySettlementListResponse,
} from '@/src/types/delivery-settlement';
import type { PrismaSettlement } from '../types';
import { prisma } from '@/src/adapters/prisma/client';

export class DeliverySettlementRepository {
  async getSettings(tenantId: string): Promise<DeliverySettlementSettingsDTO | null> {
    const settings = await prisma.deliverySettlementSettings.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!settings) return null;

    return {
      id: settings.id,
      tenantId: settings.tenant_id,
      driverPercentage: settings.driver_percentage,
      driverFixedPerKm: settings.driver_fixed_per_km,
      driverMinimumAmount: settings.driver_minimum_amount,
      driverMaximumAmount: settings.driver_maximum_amount,
      storePercentage: settings.store_percentage,
      platformPercentage: settings.platform_percentage,
      createdAt: settings.created_at.toISOString(),
      updatedAt: settings.updated_at.toISOString(),
    };
  }

  async upsertSettings(
    tenantId: string,
    input: DeliverySettlementSettingsCreateRequest,
  ): Promise<DeliverySettlementSettingsDTO> {
    const settings = await prisma.deliverySettlementSettings.upsert({
      where: { tenant_id: tenantId },
      update: {
        driver_percentage: input.driverPercentage,
        driver_fixed_per_km: input.driverFixedPerKm,
        driver_minimum_amount: input.driverMinimumAmount,
        driver_maximum_amount: input.driverMaximumAmount,
        store_percentage: input.storePercentage,
        platform_percentage: input.platformPercentage,
      },
      create: {
        tenant_id: tenantId,
        driver_percentage: input.driverPercentage,
        driver_fixed_per_km: input.driverFixedPerKm,
        driver_minimum_amount: input.driverMinimumAmount,
        driver_maximum_amount: input.driverMaximumAmount,
        store_percentage: input.storePercentage,
        platform_percentage: input.platformPercentage,
      },
    });

    return {
      id: settings.id,
      tenantId: settings.tenant_id,
      driverPercentage: settings.driver_percentage,
      driverFixedPerKm: settings.driver_fixed_per_km,
      driverMinimumAmount: settings.driver_minimum_amount,
      driverMaximumAmount: settings.driver_maximum_amount,
      storePercentage: settings.store_percentage,
      platformPercentage: settings.platform_percentage,
      createdAt: settings.created_at.toISOString(),
      updatedAt: settings.updated_at.toISOString(),
    };
  }

  async updateSettings(
    tenantId: string,
    input: DeliverySettlementSettingsUpdateRequest,
  ): Promise<DeliverySettlementSettingsDTO | null> {
    const existing = await prisma.deliverySettlementSettings.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!existing) return null;

    const settings = await prisma.deliverySettlementSettings.update({
      where: { tenant_id: tenantId },
      data: {
        ...(input.driverPercentage !== undefined && { driver_percentage: input.driverPercentage }),
        ...(input.driverFixedPerKm !== undefined && { driver_fixed_per_km: input.driverFixedPerKm }),
        ...(input.driverMinimumAmount !== undefined && { driver_minimum_amount: input.driverMinimumAmount }),
        ...(input.driverMaximumAmount !== undefined && { driver_maximum_amount: input.driverMaximumAmount }),
        ...(input.storePercentage !== undefined && { store_percentage: input.storePercentage }),
        ...(input.platformPercentage !== undefined && { platform_percentage: input.platformPercentage }),
      },
    });

    return {
      id: settings.id,
      tenantId: settings.tenant_id,
      driverPercentage: settings.driver_percentage,
      driverFixedPerKm: settings.driver_fixed_per_km,
      driverMinimumAmount: settings.driver_minimum_amount,
      driverMaximumAmount: settings.driver_maximum_amount,
      storePercentage: settings.store_percentage,
      platformPercentage: settings.platform_percentage,
      createdAt: settings.created_at.toISOString(),
      updatedAt: settings.updated_at.toISOString(),
    };
  }

  async createSettlement(
    tenantId: string,
    orderId: string,
    distanceKm: number,
    deliveryFee: number,
    driverAmount: number,
    storeAmount: number,
    platformAmount: number,
  ): Promise<DeliverySettlementDTO> {
    const settlement = await prisma.deliverySettlement.create({
      data: {
        tenant_id: tenantId,
        order_id: orderId,
        distance_km: distanceKm,
        delivery_fee: deliveryFee,
        driver_amount: driverAmount,
        store_amount: storeAmount,
        platform_amount: platformAmount,
      },
    });

    return {
      id: settlement.id,
      tenantId: settlement.tenant_id,
      orderId: settlement.order_id,
      distanceKm: settlement.distance_km,
      deliveryFee: settlement.delivery_fee,
      driverAmount: settlement.driver_amount,
      storeAmount: settlement.store_amount,
      platformAmount: settlement.platform_amount,
      settledAt: settlement.settled_at.toISOString(),
      createdAt: settlement.created_at.toISOString(),
      updatedAt: settlement.updated_at.toISOString(),
    };
  }

  async getSettlementByOrderId(
    tenantId: string,
    orderId: string,
  ): Promise<DeliverySettlementDTO | null> {
    const settlement = await prisma.deliverySettlement.findUnique({
      where: {
        order_id: orderId,
      },
    });

    if (!settlement || settlement.tenant_id !== tenantId) return null;

    return {
      id: settlement.id,
      tenantId: settlement.tenant_id,
      orderId: settlement.order_id,
      distanceKm: settlement.distance_km,
      deliveryFee: settlement.delivery_fee,
      driverAmount: settlement.driver_amount,
      storeAmount: settlement.store_amount,
      platformAmount: settlement.platform_amount,
      settledAt: settlement.settled_at.toISOString(),
      createdAt: settlement.created_at.toISOString(),
      updatedAt: settlement.updated_at.toISOString(),
    };
  }

  async listSettlements(
    request: DeliverySettlementListRequest,
  ): Promise<DeliverySettlementListResponse> {
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 100);
    const offset = (page - 1) * limit;

    const whereConditions = {
      tenant_id: request.tenantId,
      ...(request.orderId && { order_id: { contains: request.orderId, mode: 'insensitive' as const } }),
      ...(request.startDate && { settled_at: { gte: new Date(request.startDate) } }),
      ...(request.endDate && { settled_at: { lte: new Date(request.endDate) } }),
    };

    const [settlements, total] = await Promise.all([
      prisma.deliverySettlement.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: { settled_at: 'desc' },
      }),
      prisma.deliverySettlement.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      settlements: settlements.map((settlement: PrismaSettlement) => ({
        id: settlement.id,
        tenantId: settlement.tenant_id,
        orderId: settlement.order_id,
        distanceKm: settlement.distance_km,
        deliveryFee: settlement.delivery_fee,
        driverAmount: settlement.driver_amount,
        storeAmount: settlement.store_amount,
        platformAmount: settlement.platform_amount,
        settledAt: settlement.settled_at.toISOString(),
        createdAt: settlement.created_at.toISOString(),
        updatedAt: settlement.updated_at.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}
