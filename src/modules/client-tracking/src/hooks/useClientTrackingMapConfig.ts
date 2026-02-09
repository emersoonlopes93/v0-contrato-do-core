import React from 'react';
import type { ClientTrackingMapConfig } from '@/src/types/client-tracking';
import { getClientTrackingMapConfig } from '../services/clientTrackingMapService';

type State = {
  data: ClientTrackingMapConfig | null;
  loading: boolean;
  error: string | null;
};

export function useClientTrackingMapConfig(token: string): State {
  const [data, setData] = React.useState<ClientTrackingMapConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return undefined;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const config = await getClientTrackingMapConfig(token);
        if (!cancelled) setData(config);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar mapa');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { data, loading, error };
}
