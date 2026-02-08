import type { OrdersOrderDTO } from '@/src/types/orders';

export const ORDERS_EVENTS = {
  ORDER_CREATED: 'orders.created',
  ORDER_STATUS_CHANGED: 'orders.status.changed',
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
  order: OrdersOrderDTO;
}

export interface OrderStatusChangedPayload {
  tenantId: string;
  userId: string;
  orderId: string;
  orderNumber: number;
  status: string;
  timestamp: Date;
}
