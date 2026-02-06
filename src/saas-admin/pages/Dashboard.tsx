import React from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Building2, 
  Users, 
  Activity, 
  Puzzle, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle className="h-6 w-6 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Erro ao carregar</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Sem dados</h3>
            <p className="text-muted-foreground">Nenhuma métrica disponível no momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu ecossistema SaaS</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tenants Totais"
          value={metrics.totalTenants}
          icon={Building2}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Tenants Ativos"
          value={metrics.activeTenants}
          icon={CheckCircle}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Tenants Suspensos"
          value={metrics.suspendedTenants}
          icon={XCircle}
          color="red"
          trend={{ value: -2, isPositive: false }}
        />
        <MetricCard
          title="Usuários Totais"
          value={metrics.totalUsers}
          icon={Users}
          color="purple"
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Módulos Ativos"
          value={metrics.activeModules}
          icon={Puzzle}
          color="orange"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Eventos Recentes
              </h2>
            </div>
            <div className="divide-y divide-border/20">
              {metrics.recentEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhum evento recente</p>
                </div>
              ) : (
                metrics.recentEvents.map((e, index) => (
                  <div key={e.id} className="p-4 hover:bg-muted/30 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{e.action}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {e.resource}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(e.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Crescimento</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mensal</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +23%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trimestral</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +45%
                </span>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
            <h3 className="font-semibold text-foreground mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <a
                href="/admin/tenants/create"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors duration-150"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Novo Tenant</span>
              </a>
              <a
                href="/admin/modules"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors duration-150"
              >
                <Puzzle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Gerenciar Módulos</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  trend?: { value: number; isPositive: boolean };
}

function MetricCard({ title, value, icon: Icon, color, trend }: MetricCardProps) {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      trend: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      trend: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      trend: 'text-red-600 dark:text-red-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      trend: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      icon: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      trend: 'text-orange-600 dark:text-orange-400'
    }
  };

  const config = colorConfig[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg} border ${config.border}`}>
            <Icon className={`h-6 w-6 ${config.icon}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {value.toLocaleString('pt-BR')}
          </p>
        </div>
        
        {trend && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <div className="flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${
                trend.isPositive 
                  ? 'from-green-500/20 to-green-500' 
                  : 'from-red-500/20 to-red-500'
              }`} />
              <span className="text-xs text-muted-foreground">
                vs. mês anterior
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
