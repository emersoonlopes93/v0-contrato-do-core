import { prisma } from '@/src/adapters/prisma/client';
import type {
  DeliveryPricingRegionMultiplier,
  DeliveryPricingTimeMultiplier,
} from '@/src/types/delivery-pricing';

export type DeliveryPricingRow = {
  id: string;
  tenant_id: string;
  base_fee: number;
  price_per_km: number;
  free_km: number | null;
  min_fee: number;
  max_fee: number;
  additional_per_minute: number | null;
  region_multipliers: unknown;
  time_multipliers: unknown;
  created_at: Date;
  updated_at: Date;
};

type DeliveryPricingCreateInput = {
  tenant_id: string;
  base_fee: number;
  price_per_km: number;
  free_km: number | null;
  min_fee: number;
  max_fee: number;
  additional_per_minute: number | null;
  region_multipliers: DeliveryPricingRegionMultiplier[];
  time_multipliers: DeliveryPricingTimeMultiplier[];
};

type DeliveryPricingUpdateInput = Partial<Omit<DeliveryPricingCreateInput, 'tenant_id'>>;

type DeliveryPricingDelegate = {
  findUnique(args: { where: { tenant_id: string } }): Promise<DeliveryPricingRow | null>;
  upsert(args: {
    where: { tenant_id: string };
    create: DeliveryPricingCreateInput;
    update: DeliveryPricingUpdateInput;
  }): Promise<DeliveryPricingRow>;
  update(args: {
    where: { tenant_id: string };
    data: DeliveryPricingUpdateInput;
  }): Promise<DeliveryPricingRow>;
};

type DeliveryPricingPersistenceInput = {
  baseFee: number;
  pricePerKm: number;
  freeKm: number | null;
  minFee: number;
  maxFee: number;
  additionalPerMinute: number | null;
  regionMultipliers: DeliveryPricingRegionMultiplier[];
  timeMultipliers: DeliveryPricingTimeMultiplier[];
};

export class DeliveryPricingRepository {
  private readonly client = prisma as unknown as { deliveryPricingSettings: DeliveryPricingDelegate };

  async findByTenantId(tenantId: string): Promise<DeliveryPricingRow | null> {
    return this.client.deliveryPricingSettings.findUnique({
      where: { tenant_id: tenantId },
    });
  }

  async upsertByTenantId(
    tenantId: string,
    input: DeliveryPricingPersistenceInput,
  ): Promise<DeliveryPricingRow> {
    const createData: DeliveryPricingCreateInput = {
      tenant_id: tenantId,
      base_fee: input.baseFee,
      price_per_km: input.pricePerKm,
      free_km: input.freeKm,
      min_fee: input.minFee,
      max_fee: input.maxFee,
      additional_per_minute: input.additionalPerMinute,
      region_multipliers: input.regionMultipliers,
      time_multipliers: input.timeMultipliers,
    };

    const updateData: DeliveryPricingUpdateInput = {
      base_fee: input.baseFee,
      price_per_km: input.pricePerKm,
      free_km: input.freeKm,
      min_fee: input.minFee,
      max_fee: input.maxFee,
      additional_per_minute: input.additionalPerMinute,
      region_multipliers: input.regionMultipliers,
      time_multipliers: input.timeMultipliers,
    };

    return this.client.deliveryPricingSettings.upsert({
      where: { tenant_id: tenantId },
      create: createData,
      update: updateData,
    });
  }

  async updateByTenantId(
    tenantId: string,
    input: Partial<DeliveryPricingPersistenceInput>,
  ): Promise<DeliveryPricingRow | null> {
    const data: DeliveryPricingUpdateInput = {};

    if (input.baseFee !== undefined) data.base_fee = input.baseFee;
    if (input.pricePerKm !== undefined) data.price_per_km = input.pricePerKm;
    if (input.freeKm !== undefined) data.free_km = input.freeKm;
    if (input.minFee !== undefined) data.min_fee = input.minFee;
    if (input.maxFee !== undefined) data.max_fee = input.maxFee;
    if (input.additionalPerMinute !== undefined) data.additional_per_minute = input.additionalPerMinute;
    if (input.regionMultipliers !== undefined) data.region_multipliers = input.regionMultipliers;
    if (input.timeMultipliers !== undefined) data.time_multipliers = input.timeMultipliers;

    return this.client.deliveryPricingSettings.update({
      where: { tenant_id: tenantId },
      data,
    });
  }
}
