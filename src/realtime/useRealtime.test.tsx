import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { RealtimeClient } from '@/src/realtime/realtime-client';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import type { TypedRealtimeEnvelope } from '@/src/realtime/realtime-client';
import type { KnownRealtimeEventName } from '@/src/types/realtime';

let mockedClient: RealtimeClient | null = null;

vi.mock('@/src/realtime/realtime-context', () => ({
  useRealtimeContext: () => ({ client: mockedClient }),
}));

function createMockClient() {
  const handlers: Partial<
    Record<
      KnownRealtimeEventName,
      (envelope: TypedRealtimeEnvelope<KnownRealtimeEventName>) => void
    >
  > = {};

  const client: RealtimeClient = {
    socket: {} as never,
    subscribe(event, handler) {
      handlers[event] =
        handler as unknown as (envelope: TypedRealtimeEnvelope<KnownRealtimeEventName>) => void;
      return {
        unsubscribe() {
          delete handlers[event];
        },
      };
    },
    disconnect() {
    },
  };

  return { client, handlers };
}

describe('useRealtimeEvent', () => {
  it('registra e remove handler corretamente', () => {
    const { client, handlers } = createMockClient();
    mockedClient = client;
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => children;

    const handler = vi.fn();

    const { unmount } = renderHook(
      () => {
        useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, handler);
      },
      { wrapper },
    );

    expect(Object.keys(handlers)).toContain(REALTIME_ORDER_EVENTS.ORDER_CREATED);

    const envelope: TypedRealtimeEnvelope<typeof REALTIME_ORDER_EVENTS.ORDER_CREATED> = {
      eventId: '1',
      event: REALTIME_ORDER_EVENTS.ORDER_CREATED,
      tenantId: 'tenant-1',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: 'order-1',
        orderNumber: 1,
      },
    };

    act(() => {
      handlers[REALTIME_ORDER_EVENTS.ORDER_CREATED]?.(envelope);
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    expect(Object.keys(handlers)).not.toContain(REALTIME_ORDER_EVENTS.ORDER_CREATED);
  });
});
