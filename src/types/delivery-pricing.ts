export type DeliveryPricingRegionMultiplier = {
  id: string;
  label: string;
  multiplier: number;
};

export type DeliveryPricingTimeMultiplier = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  multiplier: number;
};

export type DeliveryPricingSettingsDTO = {
  id: string;
  tenantId: string;
  baseFee: number;
  pricePerKm: number;
  freeKm: number | null;
  minFee: number;
  maxFee: number;
  additionalPerMinute: number | null;
  regionMultipliers: DeliveryPricingRegionMultiplier[];
  timeMultipliers: DeliveryPricingTimeMultiplier[];
  createdAt: string;
  updatedAt: string;
};

export type DeliveryPricingSettingsCreateRequest = {
  baseFee: number;
  pricePerKm: number;
  freeKm?: number | null;
  minFee: number;
  maxFee: number;
  additionalPerMinute?: number | null;
  regionMultipliers?: DeliveryPricingRegionMultiplier[];
  timeMultipliers?: DeliveryPricingTimeMultiplier[];
};

export type DeliveryPricingSettingsUpdateRequest = Partial<DeliveryPricingSettingsCreateRequest>;

export type DeliveryPricingPreviewRequest = {
  distanceKm: number;
  etaMinutes: number;
  regionMultiplierId?: string | null;
  timeMultiplierId?: string | null;
};

export type DeliveryPricingPreviewDTO = {
  distanceKm: number;
  etaMinutes: number;
  baseFee: number;
  distanceFee: number;
  timeFee: number;
  regionMultiplier: number;
  timeMultiplier: number;
  totalFee: number;
};

export type DeliveryPricingApplyRouteStop = {
  orderId: string;
  distanceKm: number | null;
  etaMinutes: number | null;
};

export type DeliveryPricingApplyRouteRequest = {
  routeId?: string | null;
  stops: DeliveryPricingApplyRouteStop[];
};

export type DeliveryPricingServiceContract = {
  getSettings(tenantId: string): Promise<DeliveryPricingSettingsDTO | null>;
  upsertSettings(
    tenantId: string,
    input: DeliveryPricingSettingsCreateRequest,
  ): Promise<DeliveryPricingSettingsDTO>;
  updateSettings(
    tenantId: string,
    input: DeliveryPricingSettingsUpdateRequest,
  ): Promise<DeliveryPricingSettingsDTO | null>;
  preview(
    tenantId: string,
    input: DeliveryPricingPreviewRequest,
  ): Promise<DeliveryPricingPreviewDTO>;
  applyRoutePricing(
    tenantId: string,
    input: DeliveryPricingApplyRouteRequest,
  ): Promise<void>;
};
