import { useEffect } from 'react';
import type { KnownRealtimeEventName, RealtimeEventPayloads } from '@/src/types/realtime';
import type { TypedRealtimeEnvelope, RealtimeEventHandler } from '@/src/realtime/realtime-client';
import { useRealtimeContext } from '@/src/realtime/realtime-context';

export function useRealtimeEvent<TEvent extends KnownRealtimeEventName>(
  event: TEvent,
  handler: (envelope: TypedRealtimeEnvelope<TEvent>) => void,
): void {
  const { client } = useRealtimeContext();

  useEffect(() => {
    if (!client) return;

    const wrapped: RealtimeEventHandler<TEvent> = (envelope: TypedRealtimeEnvelope<TEvent>) => {
      const payload = envelope.payload as RealtimeEventPayloads[TEvent];
      handler({
        ...envelope,
        payload,
      });
    };

    const sub = client.subscribe(event, wrapped);
    return () => {
      sub.unsubscribe();
    };
  }, [client, event, handler]);
}

