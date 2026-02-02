import { prisma } from '@/src/adapters/prisma/client';
import type { StoreSettingsAddress, StoreSettingsOpeningHours, StoreSettingsPaymentMethods } from '@/src/types/store-settings';

export type StoreSettingsRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  address: unknown;
  opening_hours: unknown;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dine_in_enabled: boolean;
  minimum_order: number;
  delivery_fee: number;
  average_prep_time_min: number;
  payment_methods: unknown;
  created_at: Date;
  updated_at: Date;
};

export class StoreSettingsRepository {
  async findByTenantId(tenantId: string): Promise<StoreSettingsRow | null> {
    const row = await prisma.storeSettings.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!row) return null;
    return row as unknown as StoreSettingsRow;
  }

  async create(input: {
    tenantId: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    address: StoreSettingsAddress;
    openingHours: StoreSettingsOpeningHours;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    dineInEnabled: boolean;
    minimumOrder: number;
    deliveryFee: number;
    averagePrepTimeMinutes: number;
    paymentMethods: StoreSettingsPaymentMethods;
  }): Promise<StoreSettingsRow> {
    const row = await prisma.storeSettings.create({
      data: {
        tenant_id: input.tenantId,
        name: input.name,
        slug: input.slug,
        logo_url: input.logoUrl,
        primary_color: input.primaryColor,
        address: input.address,
        opening_hours: input.openingHours,
        delivery_enabled: input.deliveryEnabled,
        pickup_enabled: input.pickupEnabled,
        dine_in_enabled: input.dineInEnabled,
        minimum_order: input.minimumOrder,
        delivery_fee: input.deliveryFee,
        average_prep_time_min: input.averagePrepTimeMinutes,
        payment_methods: input.paymentMethods,
      },
    });
    return row as unknown as StoreSettingsRow;
  }

  async updateByTenantId(tenantId: string, patch: Partial<{
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string | null;
    address: StoreSettingsAddress;
    openingHours: StoreSettingsOpeningHours;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    dineInEnabled: boolean;
    minimumOrder: number;
    deliveryFee: number;
    averagePrepTimeMinutes: number;
    paymentMethods: StoreSettingsPaymentMethods;
  }>): Promise<StoreSettingsRow | null> {
    const existing = await prisma.storeSettings.findUnique({ where: { tenant_id: tenantId } });
    if (!existing) return null;

    const row = await prisma.storeSettings.update({
      where: { tenant_id: tenantId },
      data: {
        name: patch.name,
        slug: patch.slug,
        logo_url: patch.logoUrl,
        primary_color: patch.primaryColor,
        address: patch.address,
        opening_hours: patch.openingHours,
        delivery_enabled: patch.deliveryEnabled,
        pickup_enabled: patch.pickupEnabled,
        dine_in_enabled: patch.dineInEnabled,
        minimum_order: patch.minimumOrder,
        delivery_fee: patch.deliveryFee,
        average_prep_time_min: patch.averagePrepTimeMinutes,
        payment_methods: patch.paymentMethods,
      },
    });
    return row as unknown as StoreSettingsRow;
  }
}

