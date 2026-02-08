import React from 'react';
import { getAdminDashboardMetrics } from '@/src/saas-admin/services/adminDashboardService';
import type { SaaSAdminDashboardMetricsDTO, SaaSAdminDashboardState } from '@/src/types/saas-admin';

export function useAdminDashboard(): SaaSAdminDashboardState {
  const [metrics, setMetrics] = React.useState<SaaSAdminDashboardMetricsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [empty, setEmpty] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardMetrics();
      setMetrics(data);
      const isEmpty =
        data.totalTenants === 0 &&
        data.activeTenants === 0 &&
        data.suspendedTenants === 0 &&
        data.totalUsers === 0 &&
        data.activeModules === 0 &&
        data.recentEvents.length === 0;
      setEmpty(isEmpty);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar dashboard';
      setError(message);
      setMetrics(null);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    metrics,
    loading,
    error,
    empty,
    reload: load,
  };
}
