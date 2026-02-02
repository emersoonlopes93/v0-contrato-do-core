export const ORDERS_EVENTS = {
  ORDER_CREATED: 'orders.created',
} as const;

export type OrdersEvent = (typeof ORDERS_EVENTS)[keyof typeof ORDERS_EVENTS];

export interface OrderCreatedPayload {
  tenantId: string;
  userId: string;
  orderId: string;
  orderNumber: number;
  source: string;
  status: string;
  total: number;
  itemsCount: number;
  timestamp: Date;
}
