import type { DeliverySettlementSettingsDTO, SettlementCalculationRequest, SettlementSplitResult } from '@/src/types/delivery-settlement';

export class SettlementCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettlementCalculationError';
  }
}

export function validateSettlementRequest(request: SettlementCalculationRequest): void {
  if (!request.tenantId) {
    throw new SettlementCalculationError('Tenant ID é obrigatório');
  }
  
  if (!request.orderId) {
    throw new SettlementCalculationError('Order ID é obrigatório');
  }
  
  if (request.distanceKm <= 0) {
    throw new SettlementCalculationError('Distance KM deve ser maior que zero');
  }
  
  if (request.deliveryFee <= 0) {
    throw new SettlementCalculationError('Delivery Fee deve ser maior que zero');
  }
}

export function validateSettlementSettings(settings: DeliverySettlementSettingsDTO): void {
  const totalPercentage = settings.driverPercentage + settings.storePercentage + settings.platformPercentage;
  
  if (totalPercentage > 100) {
    throw new SettlementCalculationError('A soma das porcentagens não pode exceder 100%');
  }
  
  if (settings.driverPercentage < 0 || settings.storePercentage < 0 || settings.platformPercentage < 0) {
    throw new SettlementCalculationError('Porcentagens não podem ser negativas');
  }
  
  if (settings.driverFixedPerKm < 0) {
    throw new SettlementCalculationError('Valor fixo por KM não pode ser negativo');
  }
  
  if (settings.driverMinimumAmount < 0) {
    throw new SettlementCalculationError('Valor mínimo do entregador não pode ser negativo');
  }
  
  if (settings.driverMaximumAmount !== null && settings.driverMaximumAmount < 0) {
    throw new SettlementCalculationError('Valor máximo do entregador não pode ser negativo');
  }
}

export function calculateDriverAmount(
  settings: DeliverySettlementSettingsDTO,
  distanceKm: number,
  deliveryFee: number,
): number {
  let driverAmount: number;
  
  if (settings.driverFixedPerKm > 0) {
    driverAmount = distanceKm * settings.driverFixedPerKm;
  } else {
    driverAmount = deliveryFee * (settings.driverPercentage / 100);
  }
  
  if (driverAmount < settings.driverMinimumAmount) {
    driverAmount = settings.driverMinimumAmount;
  }
  
  if (settings.driverMaximumAmount !== null && driverAmount > settings.driverMaximumAmount) {
    driverAmount = settings.driverMaximumAmount;
  }
  
  return Math.round(driverAmount * 100) / 100;
}

export function calculatePlatformAmount(
  settings: DeliverySettlementSettingsDTO,
  deliveryFee: number,
): number {
  const platformAmount = deliveryFee * (settings.platformPercentage / 100);
  return Math.round(platformAmount * 100) / 100;
}

export function calculateStoreAmount(
  deliveryFee: number,
  driverAmount: number,
  platformAmount: number,
): number {
  const storeAmount = deliveryFee - driverAmount - platformAmount;
  return Math.round(storeAmount * 100) / 100;
}

export function calculateSettlementSplit(
  settings: DeliverySettlementSettingsDTO,
  request: SettlementCalculationRequest,
): SettlementSplitResult {
  validateSettlementRequest(request);
  validateSettlementSettings(settings);
  
  const driverAmount = calculateDriverAmount(
    settings,
    request.distanceKm,
    request.deliveryFee,
  );
  
  const platformAmount = calculatePlatformAmount(settings, request.deliveryFee);
  const storeAmount = calculateStoreAmount(request.deliveryFee, driverAmount, platformAmount);
  
  const totalSplit = driverAmount + storeAmount + platformAmount;
  const roundingDiff = request.deliveryFee - totalSplit;
  
  if (Math.abs(roundingDiff) > 0.01) {
    const adjustedStoreAmount = storeAmount + roundingDiff;
    return {
      driverAmount,
      storeAmount: Math.round(adjustedStoreAmount * 100) / 100,
      platformAmount,
    };
  }
  
  return {
    driverAmount,
    storeAmount,
    platformAmount,
  };
}
