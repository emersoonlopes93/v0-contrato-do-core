export type ClientTrackingStatus =
  | 'preparing'
  | 'in_route'
  | 'near'
  | 'delivered';

export type ClientTrackingPoint = {
  latitude: number | null;
  longitude: number | null;
  label: string | null;
};

export type ClientTrackingDriverSnapshot = {
  latitude: number | null;
  longitude: number | null;
  lastUpdateAt: string | null;
};

export type ClientTrackingSnapshot = {
  tenantSlug: string;
  orderId: string;
  publicOrderCode: string;
  status: ClientTrackingStatus;
  statusLabel: string;
  message: string;
  etaMinutes: number | null;
  restaurant: ClientTrackingPoint | null;
  customer: ClientTrackingPoint | null;
  driver: ClientTrackingDriverSnapshot | null;
  updatedAt: string;
};

export type ClientTrackingMapConfig = {
  googleMapsScript: string | null;
  googleMapsMapId: string | null;
};
