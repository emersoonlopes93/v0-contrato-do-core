export type DeliveryRouteStatus = 'planned' | 'in_progress' | 'completed';

export type DeliveryRouteStopDTO = {
  orderId: string;
  latitude: number | null;
  longitude: number | null;
  label: string | null;
  sequence: number;
  distanceKm: number | null;
  etaMinutes: number | null;
};

export type DeliveryRouteDTO = {
  id: string;
  tenantId: string;
  name: string;
  status: DeliveryRouteStatus;
  driverId: string | null;
  orderIds: string[];
  stops: DeliveryRouteStopDTO[];
  totalDistanceKm: number | null;
  totalEtaMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryRouteCreateRequest = {
  name: string;
  orderIds: string[];
  stops: Array<{
    orderId: string;
    latitude: number | null;
    longitude: number | null;
    label?: string | null;
  }>;
};

export type DeliveryRouteUpdateRequest = Partial<{
  name: string;
  status: DeliveryRouteStatus;
  driverId: string | null;
  orderIds: string[];
  stops: DeliveryRouteCreateRequest['stops'];
}>;

export type DeliveryRouteOptimizationOptions = Partial<{
  preferShortestDistance: boolean;
  preferShortestTime: boolean;
  startLatitude: number | null;
  startLongitude: number | null;
}>;

export type DistanceMatrixInput = {
  origins: Array<{ latitude: number; longitude: number }>;
  destinations: Array<{ latitude: number; longitude: number }>;
};

export type DistanceMatrixValue = {
  distanceMeters: number | null;
  durationSeconds: number | null;
};

export type DistanceMatrixResponse = {
  rows: Array<{
    elements: DistanceMatrixValue[];
  }>;
};

export type DistanceMatrixCalculateRequest = DistanceMatrixInput;

export type DistanceMatrixProviderContract = {
  calculateMatrix(input: DistanceMatrixInput): Promise<DistanceMatrixResponse>;
};

export type DeliveryRoutesServiceContract = {
  createRoute(
    tenantId: string,
    input: DeliveryRouteCreateRequest,
    options?: DeliveryRouteOptimizationOptions,
  ): Promise<DeliveryRouteDTO>;
  listRoutes(tenantId: string): Promise<DeliveryRouteDTO[]>;
  updateRoute(
    tenantId: string,
    routeId: string,
    input: DeliveryRouteUpdateRequest,
  ): Promise<DeliveryRouteDTO>;
  removeRoute(tenantId: string, routeId: string): Promise<void>;
};

export type DeliveryRoutesListResponse = DeliveryRouteDTO[];

export type DeliveryRoutesUpsertRequest = {
  route: DeliveryRouteDTO;
};

export type DeliveryRoutesUpsertResponse = DeliveryRouteDTO;

export type DeliveryRoutesDeleteResponse = {
  removed: boolean;
};
