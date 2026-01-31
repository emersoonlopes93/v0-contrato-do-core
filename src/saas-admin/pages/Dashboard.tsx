import React from 'react';
import { adminApi } from '../lib/adminApi';

interface Metrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeModules: number;
  recentEvents: Array<{ id: string; action: string; resource: string; timestamp: string }>;
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get<Metrics>('/dashboard');
        setMetrics(data);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erro ao carregar métricas';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Carregando métricas...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!metrics) return <p>Nenhuma métrica disponível</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Tenants totais" value={metrics.totalTenants} />
        <Stat label="Tenants ativos" value={metrics.activeTenants} />
        <Stat label="Tenants suspensos" value={metrics.suspendedTenants} />
        <Stat label="Usuários totais" value={metrics.totalUsers} />
        <Stat label="Módulos ativos" value={metrics.activeModules} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Eventos recentes</h2>
        <div className="rounded border bg-white">
          {metrics.recentEvents.length === 0 ? (
            <p className="p-4 text-muted-foreground">Sem eventos</p>
          ) : (
            metrics.recentEvents.map((e) => (
              <div key={e.id} className="p-3 border-b last:border-0">
                <div className="font-medium">{e.action}</div>
                <div className="text-sm text-muted-foreground">
                  {e.resource} • {new Date(e.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-white p-4 shadow">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
