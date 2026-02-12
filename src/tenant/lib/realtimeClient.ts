import { io, type Socket } from 'socket.io-client';
import type { RealtimeEnvelope, RealtimeEventName } from '@/src/core/realtime/contracts';
import { isRecord } from '@/src/core/utils/type-guards';

export function isRealtimeEnvelope(value: unknown): value is RealtimeEnvelope<Record<string, unknown>> {
  if (!isRecord(value)) return false;
  return (
    typeof value.eventId === 'string' &&
    typeof value.event === 'string' &&
    typeof value.tenantId === 'string' &&
    typeof value.timestamp === 'string' &&
    isRecord(value.payload)
  );
}

export type RealtimeDeduper = {
  has: (eventId: string) => boolean;
  add: (eventId: string) => void;
};

export function createRealtimeDeduper(maxSize = 200): RealtimeDeduper {
  const ids: string[] = [];
  const set = new Set<string>();

  return {
    has(eventId: string) {
      return set.has(eventId);
    },
    add(eventId: string) {
      if (set.has(eventId)) return;
      set.add(eventId);
      ids.push(eventId);
      while (ids.length > maxSize) {
        const removed = ids.shift();
        if (removed) set.delete(removed);
      }
    },
  };
}

export function connectTenantRealtimeSocket(tenantId: string, accessToken: string): Socket {
  return io(`/ws/tenant/${tenantId}`, {
    auth: { token: accessToken },
    autoConnect: true,
    reconnection: true,
    transports: ['websocket'],
  });
}

export type RealtimeSubscription = {
  unsubscribe: () => void;
};

export function subscribeRealtimeEvent(
  socket: Socket,
  event: RealtimeEventName,
  handler: (envelope: RealtimeEnvelope<Record<string, unknown>>) => void,
  deduper: RealtimeDeduper,
): RealtimeSubscription {
  const onMessage = (raw: unknown) => {
    if (!isRealtimeEnvelope(raw)) return;
    if (deduper.has(raw.eventId)) return;
    deduper.add(raw.eventId);
    handler(raw);
  };

  socket.on(event, onMessage);
  return {
    unsubscribe: () => {
      socket.off(event, onMessage);
    },
  };
}

