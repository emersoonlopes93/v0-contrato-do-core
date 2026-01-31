export const ORDERS_EVENTS = {
  ORDER_CREATED: 'orders.created',
} as const;

export type OrdersEvent = (typeof ORDERS_EVENTS)[keyof typeof ORDERS_EVENTS];

export interface OrderCreatedPayload {
  tenantId: string;
  userId: string;
  orderId: string;
  totalAmount: number;
  items: number;
  timestamp: Date;
}
