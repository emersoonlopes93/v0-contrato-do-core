import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { RealtimeClient } from '@/src/realtime/realtime-client';
import { RealtimeProvider } from '@/src/realtime/realtime-context';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import type { TypedRealtimeEnvelope } from '@/src/realtime/realtime-client';

function createMockClient() {
  const handlers: Record<string, (envelope: TypedRealtimeEnvelope<any>) => void> = {};

  const client: RealtimeClient = {
    socket: {} as never,
    subscribe(event, handler) {
      handlers[event] = handler as (envelope: TypedRealtimeEnvelope<any>) => void;
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
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <RealtimeProviderMock client={client}>{children}</RealtimeProviderMock>
    );

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

type RealtimeProviderMockProps = {
  client: RealtimeClient;
  children: React.ReactNode;
};

const RealtimeContext = React.createContext<{ client: RealtimeClient | null } | undefined>(undefined);

function RealtimeProviderMock({ client, children }: RealtimeProviderMockProps) {
  return <RealtimeContext.Provider value={{ client }}>{children}</RealtimeContext.Provider>;
}

