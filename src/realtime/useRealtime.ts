import { useEffect, useRef } from 'react';
import type { KnownRealtimeEventName } from '@/src/types/realtime';
import type { TypedRealtimeEnvelope, RealtimeEventHandler } from '@/src/realtime/realtime-client';
import { useRealtimeContext } from '@/src/realtime/realtime-context';
import { isRealtimeEventPayload } from '@/src/types/realtime';

export function useRealtimeEvent<TEvent extends KnownRealtimeEventName>(
  event: TEvent,
  handler: (envelope: TypedRealtimeEnvelope<TEvent>) => void,
): void {
  const { client } = useRealtimeContext();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!client) return;

    const wrapped: RealtimeEventHandler<TEvent> = (envelope: TypedRealtimeEnvelope<TEvent>) => {
      const payload: unknown = envelope.payload;
      if (!isRealtimeEventPayload(event, payload)) {
        console.warn('[Realtime] Payload inválido', { event, eventId: envelope.eventId });
        return;
      }
      try {
        handlerRef.current({
          ...envelope,
          payload,
        });
      } catch (error: unknown) {
        console.error('[Realtime] Handler falhou', error);
      }
    };

    const sub = client.subscribe(event, wrapped);
    return () => {
      sub.unsubscribe();
    };
  }, [client, event]);
}
