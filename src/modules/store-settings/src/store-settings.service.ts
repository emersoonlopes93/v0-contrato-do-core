import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  StoreSettingsAddress,
  StoreSettingsCreateRequest,
  StoreSettingsDTO,
  StoreSettingsOpeningHours,
  StoreSettingsPaymentMethods,
  StoreSettingsServiceContract,
  StoreSettingsUpdateRequest,
} from '@/src/types/store-settings';
import { StoreSettingsRepository, type StoreSettingsRow } from './store-settings.repository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStoreAddress(value: unknown): value is StoreSettingsAddress {
  if (!isRecord(value)) return false;
  return (
    isString(value.street) &&
    isString(value.number) &&
    isString(value.neighborhood) &&
    isString(value.city) &&
    isString(value.state) &&
    isString(value.zip)
  );
}

type DayKey = keyof Omit<StoreSettingsOpeningHours, 'holidays'>;

function isOpeningHoursDay(value: unknown): value is StoreSettingsOpeningHours['mon'] {
  if (!isRecord(value)) return false;
  return (
    isBoolean(value.isOpen) &&
    (value.opensAt === null || isString(value.opensAt)) &&
    (value.closesAt === null || isString(value.closesAt))
  );
}

function isOpeningHours(value: unknown): value is StoreSettingsOpeningHours {
  if (!isRecord(value)) return false;
  const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  for (const d of days) {
    if (!isOpeningHoursDay(value[d])) return false;
  }
  if (value.holidays === undefined) return true;
  if (!Array.isArray(value.holidays)) return false;
  for (const h of value.holidays) {
    if (!isRecord(h)) return false;
    if (!isString(h.date)) return false;
    if (h.name !== undefined && h.name !== null && !isString(h.name)) return false;
    if (!isBoolean(h.isOpen)) return false;
    if (!(h.opensAt === null || isString(h.opensAt))) return false;
    if (!(h.closesAt === null || isString(h.closesAt))) return false;
  }
  return true;
}

function isPaymentMethods(value: unknown): value is StoreSettingsPaymentMethods {
  if (!isRecord(value)) return false;
  if (!isBoolean(value.cash)) return false;
  if (!isBoolean(value.pix)) return false;
  if (!isRecord(value.card)) return false;
  if (!isBoolean(value.card.enabled)) return false;
  if (!Array.isArray(value.card.flags)) return false;
  if (!value.card.flags.every(isString)) return false;
  return true;
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function toDTO(row: StoreSettingsRow): StoreSettingsDTO | null {
  if (!isStoreAddress(row.address)) return null;
  if (!isOpeningHours(row.opening_hours)) return null;
  if (!isPaymentMethods(row.payment_methods)) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    address: row.address,
    openingHours: row.opening_hours,
    deliveryEnabled: row.delivery_enabled,
    pickupEnabled: row.pickup_enabled,
    dineInEnabled: row.dine_in_enabled,
    minimumOrder: row.minimum_order,
    deliveryFee: row.delivery_fee,
    averagePrepTimeMinutes: row.average_prep_time_min,
    paymentMethods: row.payment_methods,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function isCompleteDTO(dto: StoreSettingsDTO): boolean {
  if (!nonEmpty(dto.name)) return false;
  if (!nonEmpty(dto.slug)) return false;
  if (!nonEmpty(dto.address.street)) return false;
  if (!nonEmpty(dto.address.number)) return false;
  if (!nonEmpty(dto.address.neighborhood)) return false;
  if (!nonEmpty(dto.address.city)) return false;
  if (!nonEmpty(dto.address.state)) return false;
  if (!nonEmpty(dto.address.zip)) return false;

  const hasOperation = dto.deliveryEnabled || dto.pickupEnabled || dto.dineInEnabled;
  if (!hasOperation) return false;

  const p = dto.paymentMethods;
  const hasPayment = p.cash || p.pix || p.card.enabled;
  if (!hasPayment) return false;

  return true;
}

export class StoreSettingsService implements StoreSettingsServiceContract {
  private readonly repository: StoreSettingsRepository;

  constructor(context: ModuleContext) {
    this.repository = new StoreSettingsRepository();
    void context;
  }

  async getByTenantId(tenantId: string): Promise<StoreSettingsDTO | null> {
    const row = await this.repository.findByTenantId(tenantId);
    if (!row) return null;
    return toDTO(row);
  }

  async create(tenantId: string, input: StoreSettingsCreateRequest): Promise<StoreSettingsDTO> {
    const created = await this.repository.create({
      tenantId,
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl ?? null,
      primaryColor: input.primaryColor ?? null,
      address: input.address,
      openingHours: input.openingHours,
      deliveryEnabled: input.deliveryEnabled,
      pickupEnabled: input.pickupEnabled,
      dineInEnabled: input.dineInEnabled,
      minimumOrder: input.minimumOrder,
      deliveryFee: input.deliveryFee,
      averagePrepTimeMinutes: input.averagePrepTimeMinutes,
      paymentMethods: input.paymentMethods,
    });

    const dto = toDTO(created);
    if (!dto) throw new Error('StoreSettings inválido');
    return dto;
  }

  async update(tenantId: string, input: StoreSettingsUpdateRequest): Promise<StoreSettingsDTO | null> {
    const updated = await this.repository.updateByTenantId(tenantId, input);
    if (!updated) return null;
    return toDTO(updated);
  }

  async isComplete(tenantId: string): Promise<boolean> {
    const dto = await this.getByTenantId(tenantId);
    if (!dto) return false;
    return isCompleteDTO(dto);
  }
}

export function parseStoreSettingsCreateRequest(value: unknown): { data: StoreSettingsCreateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const name = value.name;
  const slug = value.slug;
  const logoUrl = value.logoUrl;
  const primaryColor = value.primaryColor;
  const address = value.address;
  const openingHours = value.openingHours;
  const deliveryEnabled = value.deliveryEnabled;
  const pickupEnabled = value.pickupEnabled;
  const dineInEnabled = value.dineInEnabled;
  const minimumOrder = value.minimumOrder;
  const deliveryFee = value.deliveryFee;
  const averagePrepTimeMinutes = value.averagePrepTimeMinutes;
  const paymentMethods = value.paymentMethods;

  if (!isString(name) || !nonEmpty(name)) return { error: 'name é obrigatório' };
  if (!isString(slug) || !nonEmpty(slug)) return { error: 'slug é obrigatório' };
  if (logoUrl !== undefined && logoUrl !== null && !isString(logoUrl)) return { error: 'logoUrl inválido' };
  if (primaryColor !== undefined && primaryColor !== null && !isString(primaryColor)) return { error: 'primaryColor inválido' };
  if (!isStoreAddress(address)) return { error: 'address inválido' };
  if (!isOpeningHours(openingHours)) return { error: 'openingHours inválido' };
  if (!isBoolean(deliveryEnabled)) return { error: 'deliveryEnabled inválido' };
  if (!isBoolean(pickupEnabled)) return { error: 'pickupEnabled inválido' };
  if (!isBoolean(dineInEnabled)) return { error: 'dineInEnabled inválido' };
  if (!isNumber(minimumOrder)) return { error: 'minimumOrder inválido' };
  if (!isNumber(deliveryFee)) return { error: 'deliveryFee inválido' };
  if (!isNumber(averagePrepTimeMinutes)) return { error: 'averagePrepTimeMinutes inválido' };
  if (!isPaymentMethods(paymentMethods)) return { error: 'paymentMethods inválido' };

  return {
    data: {
      name,
      slug,
      logoUrl: logoUrl === undefined ? undefined : (logoUrl as string | null),
      primaryColor: primaryColor === undefined ? undefined : (primaryColor as string | null),
      address,
      openingHours,
      deliveryEnabled,
      pickupEnabled,
      dineInEnabled,
      minimumOrder,
      deliveryFee,
      averagePrepTimeMinutes,
      paymentMethods,
    },
  };
}

export function parseStoreSettingsUpdateRequest(value: unknown): { data: StoreSettingsUpdateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const next: StoreSettingsUpdateRequest = {};

  if (value.name !== undefined) {
    if (!isString(value.name) || !nonEmpty(value.name)) return { error: 'name inválido' };
    next.name = value.name;
  }
  if (value.slug !== undefined) {
    if (!isString(value.slug) || !nonEmpty(value.slug)) return { error: 'slug inválido' };
    next.slug = value.slug;
  }
  if (value.logoUrl !== undefined) {
    if (value.logoUrl !== null && !isString(value.logoUrl)) return { error: 'logoUrl inválido' };
    next.logoUrl = value.logoUrl as string | null;
  }
  if (value.primaryColor !== undefined) {
    if (value.primaryColor !== null && !isString(value.primaryColor)) return { error: 'primaryColor inválido' };
    next.primaryColor = value.primaryColor as string | null;
  }
  if (value.address !== undefined) {
    if (!isStoreAddress(value.address)) return { error: 'address inválido' };
    next.address = value.address;
  }
  if (value.openingHours !== undefined) {
    if (!isOpeningHours(value.openingHours)) return { error: 'openingHours inválido' };
    next.openingHours = value.openingHours;
  }
  if (value.deliveryEnabled !== undefined) {
    if (!isBoolean(value.deliveryEnabled)) return { error: 'deliveryEnabled inválido' };
    next.deliveryEnabled = value.deliveryEnabled;
  }
  if (value.pickupEnabled !== undefined) {
    if (!isBoolean(value.pickupEnabled)) return { error: 'pickupEnabled inválido' };
    next.pickupEnabled = value.pickupEnabled;
  }
  if (value.dineInEnabled !== undefined) {
    if (!isBoolean(value.dineInEnabled)) return { error: 'dineInEnabled inválido' };
    next.dineInEnabled = value.dineInEnabled;
  }
  if (value.minimumOrder !== undefined) {
    if (!isNumber(value.minimumOrder)) return { error: 'minimumOrder inválido' };
    next.minimumOrder = value.minimumOrder;
  }
  if (value.deliveryFee !== undefined) {
    if (!isNumber(value.deliveryFee)) return { error: 'deliveryFee inválido' };
    next.deliveryFee = value.deliveryFee;
  }
  if (value.averagePrepTimeMinutes !== undefined) {
    if (!isNumber(value.averagePrepTimeMinutes)) return { error: 'averagePrepTimeMinutes inválido' };
    next.averagePrepTimeMinutes = value.averagePrepTimeMinutes;
  }
  if (value.paymentMethods !== undefined) {
    if (!isPaymentMethods(value.paymentMethods)) return { error: 'paymentMethods inválido' };
    next.paymentMethods = value.paymentMethods;
  }

  return { data: next };
}
