import type { Socket } from 'socket.io-client';
import type { RealtimeEnvelope, RealtimeEventName } from '@/src/core/realtime/contracts';
import { connectTenantRealtimeSocket, createRealtimeDeduper, subscribeRealtimeEvent } from '@/src/tenant/lib/realtimeClient';
import type { RealtimeEventPayloads, KnownRealtimeEventName } from '@/src/types/realtime';

export type TypedRealtimeEnvelope<TEvent extends KnownRealtimeEventName> = RealtimeEnvelope<
  RealtimeEventPayloads[TEvent]
>;

export type RealtimeEventHandler<TEvent extends KnownRealtimeEventName> = (
  envelope: TypedRealtimeEnvelope<TEvent>,
) => void;

export type RealtimeClientSubscription = {
  unsubscribe: () => void;
};

export type RealtimeClient = {
  socket: Socket;
  subscribe<TEvent extends KnownRealtimeEventName>(
    event: TEvent,
    handler: RealtimeEventHandler<TEvent>,
  ): RealtimeClientSubscription;
  disconnect(): void;
};

export function createRealtimeClient(tenantId: string, accessToken: string): RealtimeClient {
  const socket = connectTenantRealtimeSocket(tenantId, accessToken);
  const deduper = createRealtimeDeduper();

  return {
    socket,
    subscribe<TEvent extends KnownRealtimeEventName>(
      event: TEvent,
      handler: RealtimeEventHandler<TEvent>,
    ): RealtimeClientSubscription {
      const subscription = subscribeRealtimeEvent(
        socket,
        event as RealtimeEventName,
        (envelope: RealtimeEnvelope<Record<string, unknown>>) => {
          const typedEnvelope = envelope as RealtimeEnvelope<RealtimeEventPayloads[TEvent]>;
          handler(typedEnvelope as TypedRealtimeEnvelope<TEvent>);
        },
        deduper,
      );
      return {
        unsubscribe: () => {
          subscription.unsubscribe();
        },
      };
    },
    disconnect(): void {
      socket.disconnect();
    },
  };
}

