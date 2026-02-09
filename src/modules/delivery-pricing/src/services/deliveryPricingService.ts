import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import type { OrdersServiceContract } from '@/src/types/orders';
import type {
  DeliveryPricingApplyRouteRequest,
  DeliveryPricingPreviewDTO,
  DeliveryPricingPreviewRequest,
  DeliveryPricingRegionMultiplier,
  DeliveryPricingServiceContract,
  DeliveryPricingSettingsCreateRequest,
  DeliveryPricingSettingsDTO,
  DeliveryPricingSettingsUpdateRequest,
  DeliveryPricingTimeMultiplier,
} from '@/src/types/delivery-pricing';
import { calculateDeliveryPricing } from '../rules/deliveryPricingRules';
import { DeliveryPricingRepository, type DeliveryPricingRow } from '../repositories/deliveryPricingRepository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isTimeValue(value: unknown): value is string {
  if (!isString(value)) return false;
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  if (h < 0 || h > 23) return false;
  if (m < 0 || m > 59) return false;
  return true;
}

function parseRegionMultiplier(value: unknown): DeliveryPricingRegionMultiplier | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id) || !isNonEmpty(value.id)) return null;
  if (!isString(value.label) || !isNonEmpty(value.label)) return null;
  if (!isNumber(value.multiplier)) return null;
  return { id: value.id, label: value.label, multiplier: value.multiplier };
}

function parseTimeMultiplier(value: unknown): DeliveryPricingTimeMultiplier | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id) || !isNonEmpty(value.id)) return null;
  if (!isString(value.label) || !isNonEmpty(value.label)) return null;
  if (!isTimeValue(value.startTime)) return null;
  if (!isTimeValue(value.endTime)) return null;
  if (!isNumber(value.multiplier)) return null;
  return {
    id: value.id,
    label: value.label,
    startTime: value.startTime,
    endTime: value.endTime,
    multiplier: value.multiplier,
  };
}

function parseMultipliers<T>(
  value: unknown,
  parser: (entry: unknown) => T | null,
): { data: T[] } | { error: string } {
  if (value === undefined) return { data: [] };
  if (!Array.isArray(value)) return { error: 'multiplicadores inválidos' };
  const parsed: T[] = [];
  for (const entry of value) {
    const item = parser(entry);
    if (!item) return { error: 'multiplicadores inválidos' };
    parsed.push(item);
  }
  return { data: parsed };
}

function toDTO(row: DeliveryPricingRow): DeliveryPricingSettingsDTO {
  const regionMultipliers = Array.isArray(row.region_multipliers)
    ? row.region_multipliers
    : [];
  const timeMultipliers = Array.isArray(row.time_multipliers) ? row.time_multipliers : [];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    baseFee: row.base_fee,
    pricePerKm: row.price_per_km,
    freeKm: row.free_km ?? null,
    minFee: row.min_fee,
    maxFee: row.max_fee,
    additionalPerMinute: row.additional_per_minute ?? null,
    regionMultipliers: regionMultipliers as DeliveryPricingRegionMultiplier[],
    timeMultipliers: timeMultipliers as DeliveryPricingTimeMultiplier[],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function parseCreateRequest(
  value: unknown,
): { data: DeliveryPricingSettingsCreateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const baseFee = value.baseFee;
  const pricePerKm = value.pricePerKm;
  const freeKm = value.freeKm === undefined ? null : value.freeKm;
  const minFee = value.minFee;
  const maxFee = value.maxFee;
  const additionalPerMinute =
    value.additionalPerMinute === undefined ? null : value.additionalPerMinute;
  const regionMultipliers = value.regionMultipliers;
  const timeMultipliers = value.timeMultipliers;

  if (!isNumber(baseFee)) return { error: 'baseFee inválido' };
  if (!isNumber(pricePerKm)) return { error: 'pricePerKm inválido' };
  if (!isNullableNumber(freeKm)) return { error: 'freeKm inválido' };
  if (!isNumber(minFee)) return { error: 'minFee inválido' };
  if (!isNumber(maxFee)) return { error: 'maxFee inválido' };
  if (!isNullableNumber(additionalPerMinute)) return { error: 'additionalPerMinute inválido' };

  const parsedRegion = parseMultipliers(regionMultipliers, parseRegionMultiplier);
  if ('error' in parsedRegion) return { error: parsedRegion.error };
  const parsedTime = parseMultipliers(timeMultipliers, parseTimeMultiplier);
  if ('error' in parsedTime) return { error: parsedTime.error };

  return {
    data: {
      baseFee,
      pricePerKm,
      freeKm,
      minFee,
      maxFee,
      additionalPerMinute,
      regionMultipliers: parsedRegion.data,
      timeMultipliers: parsedTime.data,
    },
  };
}

function parseUpdateRequest(
  value: unknown,
): { data: DeliveryPricingSettingsUpdateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const next: DeliveryPricingSettingsUpdateRequest = {};

  if (value.baseFee !== undefined) {
    if (!isNumber(value.baseFee)) return { error: 'baseFee inválido' };
    next.baseFee = value.baseFee;
  }
  if (value.pricePerKm !== undefined) {
    if (!isNumber(value.pricePerKm)) return { error: 'pricePerKm inválido' };
    next.pricePerKm = value.pricePerKm;
  }
  if (value.freeKm !== undefined) {
    if (!isNullableNumber(value.freeKm)) return { error: 'freeKm inválido' };
    next.freeKm = value.freeKm;
  }
  if (value.minFee !== undefined) {
    if (!isNumber(value.minFee)) return { error: 'minFee inválido' };
    next.minFee = value.minFee;
  }
  if (value.maxFee !== undefined) {
    if (!isNumber(value.maxFee)) return { error: 'maxFee inválido' };
    next.maxFee = value.maxFee;
  }
  if (value.additionalPerMinute !== undefined) {
    if (!isNullableNumber(value.additionalPerMinute)) return { error: 'additionalPerMinute inválido' };
    next.additionalPerMinute = value.additionalPerMinute;
  }
  if (value.regionMultipliers !== undefined) {
    const parsed = parseMultipliers(value.regionMultipliers, parseRegionMultiplier);
    if ('error' in parsed) return { error: parsed.error };
    next.regionMultipliers = parsed.data;
  }
  if (value.timeMultipliers !== undefined) {
    const parsed = parseMultipliers(value.timeMultipliers, parseTimeMultiplier);
    if ('error' in parsed) return { error: parsed.error };
    next.timeMultipliers = parsed.data;
  }

  return { data: next };
}

function parsePreviewRequest(
  value: unknown,
): { data: DeliveryPricingPreviewRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const distanceKm = value.distanceKm;
  const etaMinutes = value.etaMinutes;
  const regionMultiplierId = value.regionMultiplierId;
  const timeMultiplierId = value.timeMultiplierId;

  if (!isNumber(distanceKm)) return { error: 'distanceKm inválido' };
  if (!isNumber(etaMinutes)) return { error: 'etaMinutes inválido' };
  if (regionMultiplierId !== undefined && regionMultiplierId !== null && !isString(regionMultiplierId)) {
    return { error: 'regionMultiplierId inválido' };
  }
  if (timeMultiplierId !== undefined && timeMultiplierId !== null && !isString(timeMultiplierId)) {
    return { error: 'timeMultiplierId inválido' };
  }

  return {
    data: {
      distanceKm,
      etaMinutes,
      regionMultiplierId: regionMultiplierId ?? null,
      timeMultiplierId: timeMultiplierId ?? null,
    },
  };
}

function parseApplyRouteRequest(
  value: unknown,
): { data: DeliveryPricingApplyRouteRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const stops = value.stops;
  if (!Array.isArray(stops) || stops.length === 0) return { error: 'stops inválido' };

  const parsedStops = stops.map((stop) => {
    if (!isRecord(stop)) return null;
    const orderId = stop.orderId;
    const distanceKm = stop.distanceKm;
    const etaMinutes = stop.etaMinutes;
    if (!isString(orderId) || !isNonEmpty(orderId)) return null;
    if (!isNullableNumber(distanceKm)) return null;
    if (!isNullableNumber(etaMinutes)) return null;
    return { orderId, distanceKm, etaMinutes };
  });

  if (parsedStops.some((stop) => stop === null)) return { error: 'stops inválido' };

  return {
    data: {
      routeId: isString(value.routeId) ? value.routeId : null,
      stops: parsedStops as DeliveryPricingApplyRouteRequest['stops'],
    },
  };
}

function getOrdersService(): OrdersServiceContract | null {
  return globalModuleServiceRegistry.get<OrdersServiceContract>(
    asModuleId('orders-module'),
    'OrdersService',
  );
}

export class DeliveryPricingService implements DeliveryPricingServiceContract {
  private readonly repository: DeliveryPricingRepository;

  constructor() {
    this.repository = new DeliveryPricingRepository();
  }

  async getSettings(tenantId: string): Promise<DeliveryPricingSettingsDTO | null> {
    const row = await this.repository.findByTenantId(tenantId);
    if (!row) return null;
    return toDTO(row);
  }

  async upsertSettings(
    tenantId: string,
    input: DeliveryPricingSettingsCreateRequest,
  ): Promise<DeliveryPricingSettingsDTO> {
    const row = await this.repository.upsertByTenantId(tenantId, {
      baseFee: input.baseFee,
      pricePerKm: input.pricePerKm,
      freeKm: input.freeKm ?? null,
      minFee: input.minFee,
      maxFee: input.maxFee,
      additionalPerMinute: input.additionalPerMinute ?? null,
      regionMultipliers: input.regionMultipliers ?? [],
      timeMultipliers: input.timeMultipliers ?? [],
    });
    return toDTO(row);
  }

  async updateSettings(
    tenantId: string,
    input: DeliveryPricingSettingsUpdateRequest,
  ): Promise<DeliveryPricingSettingsDTO | null> {
    const existing = await this.repository.findByTenantId(tenantId);
    if (!existing) return null;
    if (Object.keys(input).length === 0) {
      return toDTO(existing);
    }
    const row = await this.repository.updateByTenantId(tenantId, {
      baseFee: input.baseFee,
      pricePerKm: input.pricePerKm,
      freeKm: input.freeKm,
      minFee: input.minFee,
      maxFee: input.maxFee,
      additionalPerMinute: input.additionalPerMinute,
      regionMultipliers: input.regionMultipliers,
      timeMultipliers: input.timeMultipliers,
    });
    if (!row) return null;
    return toDTO(row);
  }

  async preview(
    tenantId: string,
    input: DeliveryPricingPreviewRequest,
  ): Promise<DeliveryPricingPreviewDTO> {
    const settings = await this.getSettings(tenantId);
    if (!settings) {
      throw new Error('Configuração de precificação não encontrada');
    }
    return calculateDeliveryPricing({
      distanceKm: input.distanceKm,
      etaMinutes: input.etaMinutes,
      settings,
      regionMultiplierId: input.regionMultiplierId,
      timeMultiplierId: input.timeMultiplierId,
    });
  }

  async applyRoutePricing(
    tenantId: string,
    input: DeliveryPricingApplyRouteRequest,
  ): Promise<void> {
    const settings = await this.getSettings(tenantId);
    if (!settings) {
      throw new Error('Configuração de precificação não encontrada');
    }
    const ordersService = getOrdersService();
    if (!ordersService) {
      throw new Error('Orders service não encontrado');
    }

    for (const stop of input.stops) {
      if (stop.distanceKm === null || stop.etaMinutes === null) continue;
      const preview = calculateDeliveryPricing({
        distanceKm: stop.distanceKm,
        etaMinutes: stop.etaMinutes,
        settings,
      });
      await ordersService.updateOrderDeliveryInfo({
        tenantId,
        orderId: stop.orderId,
        distanceKm: stop.distanceKm,
        etaMinutes: stop.etaMinutes,
        deliveryFee: preview.totalFee,
      });
    }
  }
}

export const deliveryPricingParsers = {
  parseCreateRequest,
  parseUpdateRequest,
  parsePreviewRequest,
  parseApplyRouteRequest,
};
