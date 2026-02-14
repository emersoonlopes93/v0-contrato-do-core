export type DeliveryDriverStatus = 'available' | 'delivering' | 'offline';

export type DeliveryDriverDTO = {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  status: DeliveryDriverStatus;
  activeOrderId: string | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
  lastDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryDriverHistoryEntryDTO = {
  id: string;
  driverId: string;
  orderId: string;
  status: DeliveryDriverStatus;
  timestamp: string;
};

export type DeliveryDriverCreateRequest = {
  name: string;
  phone?: string | null;
};

export type DeliveryDriverUpdateRequest = Partial<{
  name: string;
  phone: string | null;
  status: DeliveryDriverStatus;
  activeOrderId: string | null;
  latitude: number | null;
  longitude: number | null;
  lastLocationAt: string | null;
  lastDeliveryAt: string | null;
}>;

export type DeliveryDriverAssignmentRequest = {
  driverId: string;
  orderId: string | null;
};

export type DeliveryDriversServiceContract = {
  listDrivers(tenantId: string): Promise<DeliveryDriverDTO[]>;
  createDriver(tenantId: string, input: DeliveryDriverCreateRequest): Promise<DeliveryDriverDTO>;
  updateDriver(
    tenantId: string,
    driverId: string,
    input: DeliveryDriverUpdateRequest,
  ): Promise<DeliveryDriverDTO>;
  assignOrder(tenantId: string, input: DeliveryDriverAssignmentRequest): Promise<DeliveryDriverDTO>;
  listHistory(tenantId: string, driverId: string): Promise<DeliveryDriverHistoryEntryDTO[]>;
};

export type DeliveryDriversListResponse = DeliveryDriverDTO[];

export type DeliveryDriversHistoryListResponse = DeliveryDriverHistoryEntryDTO[];

export type DeliveryDriverHistoryAppendRequest = {
  driverId: string;
  orderId: string;
  status: DeliveryDriverStatus;
};

export type DeliveryDriverHistoryAppendResponse = DeliveryDriverHistoryEntryDTO;
