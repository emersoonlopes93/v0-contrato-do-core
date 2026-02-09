import type { DeliveryPricingPreviewDTO, DeliveryPricingSettingsDTO } from '@/src/types/delivery-pricing';

type CalculateInput = {
  distanceKm: number;
  etaMinutes: number;
  settings: DeliveryPricingSettingsDTO;
  regionMultiplierId?: string | null;
  timeMultiplierId?: string | null;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function resolveMultiplier(
  multipliers: Array<{ id: string; multiplier: number }>,
  selectedId?: string | null,
): number {
  if (!selectedId) return 1;
  const found = multipliers.find((m) => m.id === selectedId);
  return found?.multiplier ?? 1;
}

export function calculateDeliveryPricing(input: CalculateInput): DeliveryPricingPreviewDTO {
  const freeKm = input.settings.freeKm ?? 0;
  const chargeableKm = Math.max(0, input.distanceKm - freeKm);
  const distanceFee = chargeableKm * input.settings.pricePerKm;
  const timeFee = (input.settings.additionalPerMinute ?? 0) * input.etaMinutes;
  const regionMultiplier = resolveMultiplier(input.settings.regionMultipliers, input.regionMultiplierId);
  const timeMultiplier = resolveMultiplier(input.settings.timeMultipliers, input.timeMultiplierId);
  const rawTotal = (input.settings.baseFee + distanceFee + timeFee) * regionMultiplier * timeMultiplier;
  const totalFee = clamp(rawTotal, input.settings.minFee, input.settings.maxFee);

  return {
    distanceKm: input.distanceKm,
    etaMinutes: input.etaMinutes,
    baseFee: input.settings.baseFee,
    distanceFee,
    timeFee,
    regionMultiplier,
    timeMultiplier,
    totalFee,
  };
}
