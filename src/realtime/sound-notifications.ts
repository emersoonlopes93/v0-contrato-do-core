import { REALTIME_ORDER_EVENTS, REALTIME_PAYMENT_EVENTS } from '@/src/core/realtime/contracts';
import type { KnownRealtimeEventName, RealtimeEventPayloads } from '@/src/types/realtime';

export type SoundNotificationEvent =
  | typeof REALTIME_ORDER_EVENTS.ORDER_CREATED
  | typeof REALTIME_PAYMENT_EVENTS.PAYMENT_CONFIRMED;

export type SoundNotificationPayload<TEvent extends SoundNotificationEvent> =
  RealtimeEventPayloads[TEvent & KnownRealtimeEventName];

export type SoundPlayer = (frequency: number, volume: number) => void;

