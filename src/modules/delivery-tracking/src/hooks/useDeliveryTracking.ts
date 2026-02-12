import React from 'react';
import type { DeliveryTrackingSnapshot } from '@/src/types/delivery-tracking';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { getDeliveryTrackingSnapshot } from '../services/deliveryTrackingService';

type State = {
  snapshot: DeliveryTrackingSnapshot | null;
  loading: boolean;
  error: string | null;
  reload: (withLoading?: boolean) => Promise<void>;
};

type Options = {
  realtimeEnabled?: boolean;
};

export function useDeliveryTracking(tenantSlug: string, options?: Options): State {
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [snapshot, setSnapshot] = React.useState<DeliveryTrackingSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (withLoading = true) => {
      if (!tenantSlug) {
        if (withLoading) setLoading(false);
        return;
      }
      if (withLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const nextSnapshot = await getDeliveryTrackingSnapshot(tenantSlug);
        setSnapshot(nextSnapshot);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar mapa de entregas';
        setError(message);
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [tenantSlug],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!realtimeEnabled) return;
    if (typeof window === 'undefined') return;
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('delivery-driver-app');
    channel.onmessage = () => {
      void load(false);
    };
    return () => {
      channel.close();
    };
  }, [load, realtimeEnabled]);

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, () => {
    if (!realtimeEnabled) return;
    void load(false);
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, () => {
    if (!realtimeEnabled) return;
    void load(false);
  });

  return {
    snapshot,
    loading,
    error,
    reload: load,
  };
}
