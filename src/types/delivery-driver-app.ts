export type DeliveryDriverAppStatus = 'in_route' | 'stopped' | 'offline';

export type DeliveryDriverAppLocationPayload = {
  latitude: number;
  longitude: number;
  timestamp: string;
  driverId: string;
  tenantId: string;
};

export type DeliveryDriverAppOrderDTO = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
  updatedAt: string;
};
