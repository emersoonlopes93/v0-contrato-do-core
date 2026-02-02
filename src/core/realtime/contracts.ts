export const REALTIME_ORDER_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_STATUS_CHANGED: 'order.status.changed',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

export const REALTIME_CHECKOUT_EVENTS = {
  CHECKOUT_STARTED: 'checkout.started',
  CHECKOUT_AWAITING_PAYMENT: 'checkout.awaiting_payment',
} as const;

export const REALTIME_PAYMENT_EVENTS = {
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_EXPIRED: 'payment.expired',
} as const;

export const REALTIME_FINANCIAL_EVENTS = {
  FINANCIAL_UPDATED: 'financial.updated',
} as const;

export type RealtimeOrderEventName = (typeof REALTIME_ORDER_EVENTS)[keyof typeof REALTIME_ORDER_EVENTS];

export type RealtimeCheckoutEventName =
  (typeof REALTIME_CHECKOUT_EVENTS)[keyof typeof REALTIME_CHECKOUT_EVENTS];

export type RealtimePaymentEventName =
  (typeof REALTIME_PAYMENT_EVENTS)[keyof typeof REALTIME_PAYMENT_EVENTS];

export type RealtimeFinancialEventName =
  (typeof REALTIME_FINANCIAL_EVENTS)[keyof typeof REALTIME_FINANCIAL_EVENTS];

export type RealtimeEventName =
  | RealtimeOrderEventName
  | RealtimeCheckoutEventName
  | RealtimePaymentEventName
  | RealtimeFinancialEventName;

export interface RealtimeEnvelope<TPayload extends Record<string, unknown>> {
  eventId: string;
  event: RealtimeEventName;
  tenantId: string;
  payload: TPayload;
  timestamp: string;
}

export interface RealtimeEmitter {
  emitToTenant<TPayload extends Record<string, unknown>>(
    tenantId: string,
    event: RealtimeEventName,
    payload: TPayload,
    eventId?: string,
  ): void;
}
