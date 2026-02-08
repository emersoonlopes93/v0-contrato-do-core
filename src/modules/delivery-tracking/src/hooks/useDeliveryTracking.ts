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
  accessToken?: string | null;
};

export function useDeliveryTracking(tenantSlug: string, options?: Options): State {
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const accessToken = options?.accessToken ?? null;
  const [snapshot, setSnapshot] = React.useState<DeliveryTrackingSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (withLoading = true) => {
      if (!tenantSlug || !accessToken) {
        if (withLoading) setLoading(false);
        return;
      }
      if (withLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const nextSnapshot = await getDeliveryTrackingSnapshot(accessToken, tenantSlug);
        setSnapshot(nextSnapshot);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar mapa de entregas';
        setError(message);
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [accessToken, tenantSlug],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

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
