import { prisma } from '@/src/adapters/prisma/client';
import type { Prisma } from '@prisma/client';

export type TenantSettingsRow = {
  id: string;
  tenant_id: string;
  trade_name: string | null;
  legal_name: string | null;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  currency: string | null;
  payment_provider_default: string | null;
  payment_public_key: string | null;
  payment_private_key: string | null;
  kds_enabled: boolean;
  pdv_enabled: boolean;
  realtime_enabled: boolean;
  printing_enabled: boolean;
  is_open: boolean;
  created_at: Date;
  updated_at: Date;
};

export class TenantSettingsRepository {
  async findByTenantId(tenantId: string): Promise<TenantSettingsRow | null> {
    const row = await prisma.tenantSettings.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!row) return null;
    return row as unknown as TenantSettingsRow;
  }

  async upsertByTenantId(
    tenantId: string,
    patch: Partial<{
      tradeName: string | null;
      legalName: string | null;
      document: string | null;
      phone: string | null;
      whatsapp: string | null;
      email: string | null;
      addressStreet: string | null;
      addressNumber: string | null;
      addressComplement: string | null;
      addressNeighborhood: string | null;
      addressCity: string | null;
      addressState: string | null;
      addressZip: string | null;
      latitude: number | null;
      longitude: number | null;
      timezone: string | null;
      currency: string | null;
      kdsEnabled: boolean;
      pdvEnabled: boolean;
      realtimeEnabled: boolean;
      printingEnabled: boolean;
      isOpen: boolean;
    }>,
  ): Promise<TenantSettingsRow> {
    const createData = {
      tenant_id: tenantId,
      trade_name: patch.tradeName ?? null,
      legal_name: patch.legalName ?? null,
      document: patch.document ?? null,
      phone: patch.phone ?? null,
      whatsapp: patch.whatsapp ?? null,
      email: patch.email ?? null,
      address_street: patch.addressStreet ?? null,
      address_number: patch.addressNumber ?? null,
      address_complement: patch.addressComplement ?? null,
      address_neighborhood: patch.addressNeighborhood ?? null,
      address_city: patch.addressCity ?? null,
      address_state: patch.addressState ?? null,
      address_zip: patch.addressZip ?? null,
      latitude: patch.latitude ?? null,
      longitude: patch.longitude ?? null,
      timezone: patch.timezone ?? null,
      currency: patch.currency ?? null,
      kds_enabled: patch.kdsEnabled ?? true,
      pdv_enabled: patch.pdvEnabled ?? true,
      realtime_enabled: patch.realtimeEnabled ?? true,
      printing_enabled: patch.printingEnabled ?? false,
      is_open: patch.isOpen ?? false,
    } as unknown as Prisma.TenantSettingsUncheckedCreateInput;

    const updateData = {
      trade_name: patch.tradeName,
      legal_name: patch.legalName,
      document: patch.document,
      phone: patch.phone,
      whatsapp: patch.whatsapp,
      email: patch.email,
      address_street: patch.addressStreet,
      address_number: patch.addressNumber,
      address_complement: patch.addressComplement,
      address_neighborhood: patch.addressNeighborhood,
      address_city: patch.addressCity,
      address_state: patch.addressState,
      address_zip: patch.addressZip,
      latitude: patch.latitude,
      longitude: patch.longitude,
      timezone: patch.timezone,
      currency: patch.currency,
      kds_enabled: patch.kdsEnabled,
      pdv_enabled: patch.pdvEnabled,
      realtime_enabled: patch.realtimeEnabled,
      printing_enabled: patch.printingEnabled,
      is_open: patch.isOpen,
    } as unknown as Prisma.TenantSettingsUncheckedUpdateInput;

    const row = await prisma.tenantSettings.upsert({
      where: { tenant_id: tenantId },
      create: createData,
      update: updateData,
    });
    return row as unknown as TenantSettingsRow;
  }
}
