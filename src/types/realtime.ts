import type {
  RealtimeEventName,
  RealtimeOrderEventName,
  RealtimeCheckoutEventName,
  RealtimePaymentEventName,
  RealtimeFinancialEventName,
} from '@/src/core/realtime/contracts';
import type { OrdersOrderDTO, OrdersOrderSummaryDTO } from '@/src/types/orders';

import type { PaymentsDTO } from '@/src/types/payments';
import type { FinancialSummaryDTO } from '@/src/types/financial';

export type RealtimeOrderCreatedPayload = {
  orderId: string;
  orderNumber: number;
  order?: OrdersOrderDTO;
};

export type RealtimeOrderStatusChangedPayload = {
  orderId: string;
  status: string;
};

export type RealtimeOrderUpdatedPayload = {
  orderId: string;
  status: string;
  order?: OrdersOrderDTO;
};

export type RealtimeOrderCancelledPayload = {
  orderId: string;
  status: string;
  order?: OrdersOrderDTO;
};

export type RealtimeCheckoutStartedPayload = {
  orderId: string;
  orderNumber: number;
  status: string;
  total: number;
};

export type RealtimeCheckoutAwaitingPaymentPayload = {
  orderId: string;
  paymentId: string;
  provider: PaymentsDTO['provider'];
  method: PaymentsDTO['method'];
  status: PaymentsDTO['status'];
  amount: number;
};

export type RealtimePaymentConfirmedPayload = {
  paymentId: string;
  orderId: string;
  status: PaymentsDTO['status'];
  provider: PaymentsDTO['provider'];
};

export type RealtimePaymentFailedPayload = RealtimePaymentConfirmedPayload;

export type RealtimePaymentExpiredPayload = RealtimePaymentConfirmedPayload;

export type RealtimeFinancialUpdatedPayload = FinancialSummaryDTO;

export type OrdersRealtimeEventName = Extract<
  RealtimeOrderEventName,
  'order.created' | 'order.updated' | 'order.status.changed' | 'order.cancelled'
>;

export type CheckoutRealtimeEventName = Extract<
  RealtimeCheckoutEventName,
  'checkout.started' | 'checkout.awaiting_payment'
>;

export type PaymentsRealtimeEventName = Extract<
  RealtimePaymentEventName,
  'payment.confirmed' | 'payment.failed' | 'payment.expired'
>;

export type FinancialRealtimeEventName = Extract<RealtimeFinancialEventName, 'financial.updated'>;

export type RealtimeEventPayloads = {
  'order.created': RealtimeOrderCreatedPayload;
  'order.updated': RealtimeOrderUpdatedPayload;
  'order.status.changed': RealtimeOrderStatusChangedPayload;
  'order.cancelled': RealtimeOrderCancelledPayload;
  'checkout.started': RealtimeCheckoutStartedPayload;
  'checkout.awaiting_payment': RealtimeCheckoutAwaitingPaymentPayload;
  'payment.confirmed': RealtimePaymentConfirmedPayload;
  'payment.failed': RealtimePaymentFailedPayload;
  'payment.expired': RealtimePaymentExpiredPayload;
  'financial.updated': RealtimeFinancialUpdatedPayload;
};

export type KnownRealtimeEventName = Extract<RealtimeEventName, keyof RealtimeEventPayloads>;

export type OrdersListUpdatableEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.status.changed'
  | 'order.cancelled'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'payment.expired';

export type OrdersKanbanUpdatableEvent = OrdersListUpdatableEvent;

export type OrdersKanbanState = OrdersOrderSummaryDTO[];
