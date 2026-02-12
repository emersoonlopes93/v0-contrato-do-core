export type DeliverySettlementDTO = {
  id: string;
  tenantId: string;
  orderId: string;
  distanceKm: number;
  deliveryFee: number;
  driverAmount: number;
  storeAmount: number;
  platformAmount: number;
  settledAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliverySettlementSettingsDTO = {
  id: string;
  tenantId: string;
  driverPercentage: number;
  driverFixedPerKm: number;
  driverMinimumAmount: number;
  driverMaximumAmount: number | null;
  storePercentage: number;
  platformPercentage: number;
  createdAt: string;
  updatedAt: string;
};

export type DeliverySettlementSettingsCreateRequest = {
  driverPercentage: number;
  driverFixedPerKm: number;
  driverMinimumAmount: number;
  driverMaximumAmount?: number | null;
  storePercentage: number;
  platformPercentage: number;
};

export type DeliverySettlementSettingsUpdateRequest = Partial<DeliverySettlementSettingsCreateRequest>;

export type SettlementCalculationRequest = {
  tenantId: string;
  orderId: string;
  distanceKm: number;
  deliveryFee: number;
};

export type SettlementSplitResult = {
  driverAmount: number;
  storeAmount: number;
  platformAmount: number;
};

export type DeliverySettlementListRequest = {
  tenantId: string;
  page?: number;
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
  orderId?: string | null;
};

export type DeliverySettlementListResponse = {
  settlements: DeliverySettlementDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DeliverySettlementServiceContract = {
  getSettings(tenantId: string): Promise<DeliverySettlementSettingsDTO | null>;
  upsertSettings(
    tenantId: string,
    input: DeliverySettlementSettingsCreateRequest,
  ): Promise<DeliverySettlementSettingsDTO>;
  updateSettings(
    tenantId: string,
    input: DeliverySettlementSettingsUpdateRequest,
  ): Promise<DeliverySettlementSettingsDTO | null>;
  calculateSplit(
    tenantId: string,
    request: SettlementCalculationRequest,
  ): Promise<SettlementSplitResult>;
  createSettlement(
    tenantId: string,
    orderId: string,
    distanceKm: number,
    deliveryFee: number,
  ): Promise<DeliverySettlementDTO>;
  getSettlementByOrderId(
    tenantId: string,
    orderId: string,
  ): Promise<DeliverySettlementDTO | null>;
  listSettlements(
    request: DeliverySettlementListRequest,
  ): Promise<DeliverySettlementListResponse>;
};
