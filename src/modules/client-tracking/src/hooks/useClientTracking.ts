import React from 'react';
import type { ClientTrackingSnapshot } from '@/src/types/client-tracking';
import { getClientTrackingSnapshot } from '../services/clientTrackingService';

type State = {
  snapshot: ClientTrackingSnapshot | null;
  loading: boolean;
  error: string | null;
  reload: (withLoading?: boolean) => Promise<void>;
};

type Options = {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
};

export function useClientTracking(token: string, options?: Options): State {
  const autoRefresh = options?.autoRefresh ?? true;
  const refreshIntervalMs = options?.refreshIntervalMs ?? 15000;
  const [snapshot, setSnapshot] = React.useState<ClientTrackingSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (withLoading = true) => {
      if (!token) {
        if (withLoading) setLoading(false);
        return;
      }
      if (withLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await getClientTrackingSnapshot(token);
        setSnapshot(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar tracking';
        setError(message);
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [token],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!autoRefresh) return undefined;
    if (!token) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void load(false);
    }, refreshIntervalMs);
    return () => {
      window.clearInterval(interval);
    };
  }, [autoRefresh, load, refreshIntervalMs, token]);

  React.useEffect(() => {
    if (!autoRefresh) return undefined;
    if (typeof document === 'undefined') return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [autoRefresh, load]);

  return {
    snapshot,
    loading,
    error,
    reload: load,
  };
}
