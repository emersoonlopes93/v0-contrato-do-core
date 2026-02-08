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

type RealtimePayloadValidatorMap = {
  [K in KnownRealtimeEventName]: (payload: unknown) => payload is RealtimeEventPayloads[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalRecord(value: unknown): boolean {
  return value === undefined || isRecord(value);
}

function isOrderCreatedPayload(payload: unknown): payload is RealtimeOrderCreatedPayload {
  if (!isRecord(payload)) return false;
  return isString(payload.orderId) && isNumber(payload.orderNumber) && isOptionalRecord(payload.order);
}

function isOrderStatusChangedPayload(payload: unknown): payload is RealtimeOrderStatusChangedPayload {
  if (!isRecord(payload)) return false;
  return isString(payload.orderId) && isString(payload.status);
}

function isOrderUpdatedPayload(payload: unknown): payload is RealtimeOrderUpdatedPayload {
  if (!isRecord(payload)) return false;
  return isString(payload.orderId) && isString(payload.status) && isOptionalRecord(payload.order);
}

function isOrderCancelledPayload(payload: unknown): payload is RealtimeOrderCancelledPayload {
  if (!isRecord(payload)) return false;
  return isString(payload.orderId) && isString(payload.status) && isOptionalRecord(payload.order);
}

function isCheckoutStartedPayload(payload: unknown): payload is RealtimeCheckoutStartedPayload {
  if (!isRecord(payload)) return false;
  return (
    isString(payload.orderId) &&
    isNumber(payload.orderNumber) &&
    isString(payload.status) &&
    isNumber(payload.total)
  );
}

function isCheckoutAwaitingPaymentPayload(payload: unknown): payload is RealtimeCheckoutAwaitingPaymentPayload {
  if (!isRecord(payload)) return false;
  return (
    isString(payload.orderId) &&
    isString(payload.paymentId) &&
    isString(payload.provider) &&
    isString(payload.method) &&
    isString(payload.status) &&
    isNumber(payload.amount)
  );
}

function isPaymentPayload(payload: unknown): payload is RealtimePaymentConfirmedPayload {
  if (!isRecord(payload)) return false;
  return (
    isString(payload.paymentId) &&
    isString(payload.orderId) &&
    isString(payload.status) &&
    isString(payload.provider)
  );
}

function isFinancialUpdatedPayload(payload: unknown): payload is RealtimeFinancialUpdatedPayload {
  if (!isRecord(payload)) return false;
  return (
    isString(payload.id) &&
    isString(payload.tenantId) &&
    isNumber(payload.totalOrders) &&
    isNumber(payload.totalPaid) &&
    isNumber(payload.totalPending) &&
    isNumber(payload.totalCancelled) &&
    isNumber(payload.totalRefunded) &&
    isNumber(payload.totalFees) &&
    isNumber(payload.netAmount) &&
    isString(payload.updatedAt)
  );
}

const realtimePayloadValidators: RealtimePayloadValidatorMap = {
  'order.created': isOrderCreatedPayload,
  'order.updated': isOrderUpdatedPayload,
  'order.status.changed': isOrderStatusChangedPayload,
  'order.cancelled': isOrderCancelledPayload,
  'checkout.started': isCheckoutStartedPayload,
  'checkout.awaiting_payment': isCheckoutAwaitingPaymentPayload,
  'payment.confirmed': isPaymentPayload,
  'payment.failed': isPaymentPayload,
  'payment.expired': isPaymentPayload,
  'financial.updated': isFinancialUpdatedPayload,
};

export function isRealtimeEventPayload<TEvent extends KnownRealtimeEventName>(
  event: TEvent,
  payload: unknown,
): payload is RealtimeEventPayloads[TEvent] {
  const validator = realtimePayloadValidators[event];
  return validator ? validator(payload) : false;
}
