import React from 'react';
import type { DeliveryTrackingMapConfig } from '@/src/types/delivery-tracking';
import { getDeliveryTrackingMapConfig } from '../services/deliveryTrackingMapService';

type State = {
  mapConfig: DeliveryTrackingMapConfig | null;
  loading: boolean;
  error: string | null;
};

export function useDeliveryTrackingMapConfig(accessToken: string | null): State {
  const [mapConfig, setMapConfig] = React.useState<DeliveryTrackingMapConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDeliveryTrackingMapConfig(accessToken);
        if (!cancelled) setMapConfig(data);
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Erro ao carregar mapa';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return {
    mapConfig,
    loading,
    error,
  };
}
