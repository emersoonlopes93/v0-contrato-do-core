import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  TenantSettingsDTO,
  TenantSettingsServiceContract,
  TenantSettingsUpdateRequest,
} from '@/src/types/tenant-settings';
import { TenantSettingsRepository, type TenantSettingsRow } from './tenant-settings.repository';

function toDTO(row: TenantSettingsRow): TenantSettingsDTO {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tradeName: row.trade_name,
    legalName: row.legal_name,
    document: row.document,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    currency: row.currency,
    paymentProviderDefault: row.payment_provider_default,
    paymentPublicKey: row.payment_public_key,
    paymentPrivateKey: row.payment_private_key,
    kdsEnabled: row.kds_enabled,
    pdvEnabled: row.pdv_enabled,
    realtimeEnabled: row.realtime_enabled,
    printingEnabled: row.printing_enabled,
    isOpen: row.is_open,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function parseTenantSettingsUpdateRequest(
  value: unknown,
): { data: TenantSettingsUpdateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const next: TenantSettingsUpdateRequest = {};

  if (value.tradeName !== undefined) {
    if (value.tradeName !== null && !isString(value.tradeName)) return { error: 'tradeName inválido' };
    next.tradeName = value.tradeName as string | null;
  }
  if (value.legalName !== undefined) {
    if (value.legalName !== null && !isString(value.legalName)) return { error: 'legalName inválido' };
    next.legalName = value.legalName as string | null;
  }
  if (value.document !== undefined) {
    if (value.document !== null && !isString(value.document)) return { error: 'document inválido' };
    next.document = value.document as string | null;
  }
  if (value.phone !== undefined) {
    if (value.phone !== null && !isString(value.phone)) return { error: 'phone inválido' };
    next.phone = value.phone as string | null;
  }
  if (value.whatsapp !== undefined) {
    if (value.whatsapp !== null && !isString(value.whatsapp)) return { error: 'whatsapp inválido' };
    next.whatsapp = value.whatsapp as string | null;
  }
  if (value.email !== undefined) {
    if (value.email !== null && !isString(value.email)) return { error: 'email inválido' };
    next.email = value.email as string | null;
  }
  if (value.addressStreet !== undefined) {
    if (value.addressStreet !== null && !isString(value.addressStreet)) return { error: 'addressStreet inválido' };
    next.addressStreet = value.addressStreet as string | null;
  }
  if (value.addressNumber !== undefined) {
    if (value.addressNumber !== null && !isString(value.addressNumber)) return { error: 'addressNumber inválido' };
    next.addressNumber = value.addressNumber as string | null;
  }
  if (value.addressComplement !== undefined) {
    if (value.addressComplement !== null && !isString(value.addressComplement)) return { error: 'addressComplement inválido' };
    next.addressComplement = value.addressComplement as string | null;
  }
  if (value.addressNeighborhood !== undefined) {
    if (value.addressNeighborhood !== null && !isString(value.addressNeighborhood)) return { error: 'addressNeighborhood inválido' };
    next.addressNeighborhood = value.addressNeighborhood as string | null;
  }
  if (value.addressCity !== undefined) {
    if (value.addressCity !== null && !isString(value.addressCity)) return { error: 'addressCity inválido' };
    next.addressCity = value.addressCity as string | null;
  }
  if (value.addressState !== undefined) {
    if (value.addressState !== null && !isString(value.addressState)) return { error: 'addressState inválido' };
    next.addressState = value.addressState as string | null;
  }
  if (value.addressZip !== undefined) {
    if (value.addressZip !== null && !isString(value.addressZip)) return { error: 'addressZip inválido' };
    next.addressZip = value.addressZip as string | null;
  }
  if (value.latitude !== undefined) {
    if (value.latitude !== null && !isNumber(value.latitude)) return { error: 'latitude inválido' };
    next.latitude = value.latitude as number | null;
  }
  if (value.longitude !== undefined) {
    if (value.longitude !== null && !isNumber(value.longitude)) return { error: 'longitude inválido' };
    next.longitude = value.longitude as number | null;
  }
  if (value.timezone !== undefined) {
    if (value.timezone !== null && !isString(value.timezone)) return { error: 'timezone inválido' };
    next.timezone = value.timezone as string | null;
  }
  if (value.currency !== undefined) {
    if (value.currency !== null && !isString(value.currency)) return { error: 'currency inválido' };
    next.currency = value.currency as string | null;
  }
  if (value.kdsEnabled !== undefined) {
    if (!isBoolean(value.kdsEnabled)) return { error: 'kdsEnabled inválido' };
    next.kdsEnabled = value.kdsEnabled;
  }
  if (value.pdvEnabled !== undefined) {
    if (!isBoolean(value.pdvEnabled)) return { error: 'pdvEnabled inválido' };
    next.pdvEnabled = value.pdvEnabled;
  }
  if (value.realtimeEnabled !== undefined) {
    if (!isBoolean(value.realtimeEnabled)) return { error: 'realtimeEnabled inválido' };
    next.realtimeEnabled = value.realtimeEnabled;
  }
  if (value.printingEnabled !== undefined) {
    if (!isBoolean(value.printingEnabled)) return { error: 'printingEnabled inválido' };
    next.printingEnabled = value.printingEnabled;
  }
  if (value.isOpen !== undefined) {
    if (!isBoolean(value.isOpen)) return { error: 'isOpen inválido' };
    next.isOpen = value.isOpen;
  }

  return { data: next };
}

export class TenantSettingsService implements TenantSettingsServiceContract {
  private readonly repository: TenantSettingsRepository;

  constructor(context: ModuleContext) {
    void context;
    this.repository = new TenantSettingsRepository();
  }

  async getByTenantId(tenantId: string): Promise<TenantSettingsDTO | null> {
    const row = await this.repository.findByTenantId(tenantId);
    return row ? toDTO(row) : null;
  }

  async upsert(tenantId: string, input: TenantSettingsUpdateRequest): Promise<TenantSettingsDTO> {
    const row = await this.repository.upsertByTenantId(tenantId, input);
    return toDTO(row);
  }
}
