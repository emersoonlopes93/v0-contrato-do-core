import React from 'react';
import {
  Building2,
  Users,
  Activity,
  Puzzle,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  DollarSign,
  ShoppingCart,
  Star,
  BarChart3,
} from 'lucide-react';
import { useAdminDashboard } from '@/src/saas-admin/hooks/useAdminDashboard';
import type { SaaSAdminDashboardEventDTO } from '@/src/types/saas-admin';

export function AdminDashboardPage() {
  const { metrics, loading, error, empty } = useAdminDashboard();

  if (loading) {
    return (
      <div className="saas-admin-app min-h-screen bg-gradient-to-br from-background-app via-background to-background-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-lg">Carregando visão geral...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-admin-app min-h-screen bg-gradient-to-br from-background-app via-background to-background-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-danger/10 border border-danger/20">
          <AlertTriangle className="h-12 w-12 text-danger" />
          <div>
            <h3 className="text-xl font-semibold text-danger mb-2">Erro ao carregar</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const highlightEvents: SaaSAdminDashboardEventDTO[] = metrics?.recentEvents.slice(0, 2) ?? [];
  const hasEvents = (metrics?.recentEvents.length ?? 0) > 0;
  const activationRate =
    metrics && metrics.totalTenants > 0
      ? `${Math.round((metrics.activeModules / metrics.totalTenants) * 100)}%`
      : 'Sem dados';
  const lastUpdateLabel = metrics ? new Date().toLocaleString('pt-BR') : 'Sem dados disponíveis';

  return (
    <div className="saas-admin-app min-h-screen bg-gradient-to-br from-background-app via-background to-background-surface">
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container-responsive mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Visão Geral do Negócio</h1>
                <p className="text-muted-foreground mt-1">Monitore em tempo real todas as operações</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Última atualização: {lastUpdateLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(empty || !hasEvents) && (
            <div className="p-6 rounded-2xl border border-border/40 bg-card/50">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Sem alertas no momento</h3>
                  <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para monitorar eventos.</p>
                </div>
              </div>
            </div>
          )}
          {!empty &&
            hasEvents &&
            highlightEvents.map((event) => (
              <div key={event.id} className="p-6 rounded-2xl border border-border/40 bg-card/50">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{event.action}</h3>
                    <p className="text-sm text-muted-foreground">{event.resource}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Tenants</h3>
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{empty ? 'Sem dados' : metrics?.totalTenants}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-success">{empty ? '—' : `${metrics?.activeTenants ?? 0} ativos`}</span>
                <span className="text-muted-foreground">{empty ? '—' : `${metrics?.suspendedTenants ?? 0} suspensos`}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <h3 className="font-semibold text-foreground">Usuários</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">
                {empty ? 'Sem dados' : metrics?.totalUsers.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">Total cadastrados</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Puzzle className="h-5 w-5 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground">Módulos</h3>
              </div>
              <Activity className="h-4 w-4 text-warning" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{empty ? 'Sem dados' : metrics?.activeModules}</div>
              <div className="text-sm text-muted-foreground">Módulos ativos</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                  <Activity className="h-5 w-5 text-info" />
                </div>
                <h3 className="font-semibold text-foreground">Taxa de Ativação</h3>
              </div>
              <Star className="h-4 w-4 text-info" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{activationRate}</div>
              <div className="text-sm text-muted-foreground">Média por tenant</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            Atalhos Rápidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-accent hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Novo Pedido</div>
                  <div className="text-sm text-muted-foreground">Criar pedido manual</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-accent hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Cadastrar Cliente</div>
                  <div className="text-sm text-muted-foreground">Adicionar novo usuário</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-accent hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-3">
                <Puzzle className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Gerenciar Módulos</div>
                  <div className="text-sm text-muted-foreground">Marketplace interno</div>
                </div>
              </div>
            </button>
            
            <button className="p-4 rounded-xl border border-border/40 bg-background/50 hover:bg-accent hover:shadow-md transition-all duration-200 text-left">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">Relatórios</div>
                  <div className="text-sm text-muted-foreground">Ver financeiro</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            Eventos Recentes
          </h2>
          <div className="space-y-4">
            {(!hasEvents || empty) && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">Sem dados suficientes no momento</div>
                  <div className="text-sm text-muted-foreground">Aguardando primeira atividade</div>
                </div>
              </div>
            )}
            {!empty &&
              hasEvents &&
              metrics?.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/20 hover:bg-muted/30 transition-colors duration-150"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{event.action}</div>
                        <div className="text-sm text-muted-foreground">{event.resource}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
