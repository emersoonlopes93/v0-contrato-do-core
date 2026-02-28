'use client';

import React, { useMemo, useState } from 'react';
import { useDashboardExecutivo } from '../hooks/useDashboardExecutivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  RefreshCcw,
  AlertCircle,
  Download,
  Sparkles
} from 'lucide-react';
import { useTenant } from '@/src/contexts/TenantContext';
import { useSession } from '@/src/tenant/context/SessionContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

type PeriodUi = 'today' | '7d' | '30d' | 'custom';
type NavMode = 'essential' | 'professional';

type KpiCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  trendValue?: number | null;
  trendLabel: string;
  tooltip: string;
  sparklineData?: number[];
  valueClassName?: string;
};

function KpiCard({
  title,
  value,
  icon,
  trendValue,
  trendLabel,
  tooltip,
  sparklineData,
  valueClassName,
}: KpiCardProps) {
  const hasTrendValue = typeof trendValue === 'number';
  const trendPositive = (trendValue ?? 0) >= 0;

  return (
    <Card className="w-full rounded-2xl bg-card/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-3 sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground sm:text-base">{title}</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                  <span className="text-xs font-medium sm:text-sm">i</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </div>
          <div className={`text-3xl tracking-tight text-foreground sm:text-4xl ${valueClassName ?? 'font-semibold'}`}>
            {value}
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-5 pb-6 pt-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          {hasTrendValue ? (
            <>
              {trendPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <Badge variant="secondary" className={trendPositive ? 'text-emerald-600' : 'text-rose-600'}>
                {formatPercent(Math.abs(trendValue ?? 0))}
              </Badge>
            </>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              Sem comparação
            </Badge>
          )}
          <span className="text-xs text-muted-foreground sm:text-sm">{trendLabel}</span>
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-12 w-full sm:h-10 sm:w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((value, index) => ({ index, value }))}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                  className="text-foreground/70"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardExecutivoPage() {
  const [periodUi, setPeriodUi] = useState<PeriodUi>('30d');
  const dataPeriod = periodUi === 'today' ? 'custom' : periodUi;
  const { data, loading, error } = useDashboardExecutivo(dataPeriod);
  const { tenantSlug } = useTenant();
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;
  const searchMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
  const navMode: NavMode = searchMode === 'professional' ? 'professional' : 'essential';

  const periodLabelMap: Record<PeriodUi, string> = {
    today: 'Hoje',
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    custom: 'Personalizado',
  };

  const receitaSparkline = data
    ? [data.receita.hoje, data.receita.ultimos7dias, data.receita.ultimos30dias]
    : [];
  const pedidosSparkline = data
    ? [data.pedidos.hoje, data.pedidos.ultimos7dias, data.pedidos.ultimos30dias]
    : [];

  const rfmBuckets = useMemo(() => {
    const base = { vip: 0, recorrentes: 0, novos: 0, total: 0 };
    if (!data?.topClientes || data.topClientes.length === 0) {
      return base;
    }
    const result = data.topClientes.reduce(
      (acc, cliente) => {
        const score = cliente.scoreRFM ?? 0;
        if (score >= 4) {
          acc.vip += 1;
        } else if (score >= 2) {
          acc.recorrentes += 1;
        } else {
          acc.novos += 1;
        }
        return acc;
      },
      { vip: 0, recorrentes: 0, novos: 0, total: 0 }
    );
    return { ...result, total: data.topClientes.length };
  }, [data?.topClientes]);

  const taxaRecompraPercent = Math.max(0, Math.min(100, (data?.taxaRecompra ?? 0) * 100));
  const ticketMedio7d = data && data.pedidos.ultimos7dias > 0 ? data.receita.ultimos7dias / data.pedidos.ultimos7dias : 0;

  const insights = useMemo(() => {
    if (!data) return [];
    const items: string[] = [];
    if (data.receita.crescimentoPercentual >= 0) {
      items.push(`Sua receita cresceu ${formatPercent(data.receita.crescimentoPercentual)} no período analisado`);
    } else {
      items.push(`Sua receita caiu ${formatPercent(Math.abs(data.receita.crescimentoPercentual))} no período analisado`);
    }
    items.push(
      `Clientes fiéis representam ${formatPercent(data.taxaRecompra * 100)} da base ativa`
    );
    if (data.performanceEntrega) {
      items.push(`Tempo médio de entrega atual: ${Math.round(data.performanceEntrega.tempoMedioReal)} min`);
    }
    items.push(`Pedidos nos últimos 30 dias: ${data.pedidos.ultimos30dias}`);
    return items.slice(0, 3);
  }, [data]);

  if (loading) {
    return <div className="p-8 flex justify-center">Carregando dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>Erro: {error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard Executivo</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Visão estratégica do seu negócio em tempo real • {periodLabelMap[periodUi]}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Tabs value={periodUi} onValueChange={(value) => setPeriodUi(value as PeriodUi)}>
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
                <TabsTrigger value="today" className="h-11 text-sm sm:text-base">Hoje</TabsTrigger>
                <TabsTrigger value="7d" className="h-11 text-sm sm:text-base">7 dias</TabsTrigger>
                <TabsTrigger value="30d" className="h-11 text-sm sm:text-base">30 dias</TabsTrigger>
                <TabsTrigger value="custom" className="h-11 text-sm sm:text-base">Personalizado</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="h-11 w-full gap-2 text-sm sm:w-auto sm:text-base">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl border p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a href={`${basePath}/pdv`}>
                <Button className="w-full h-11">Novo Pedido</Button>
              </a>
              <a href={`${basePath}/cashier`}>
                <Button variant="outline" className="w-full h-11">Abrir Caixa</Button>
              </a>
              <a href={`${basePath}${isModuleEnabled('delivery-tracking') ? '/delivery-tracking' : '/delivery-drivers'}`}>
                <Button variant="outline" className="w-full h-11">Ver Entregas</Button>
              </a>
              <a href={`${basePath}/menu-online`}>
                <Button variant="outline" className="w-full h-11">Editar Cardápio</Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Receita Hoje"
              value={formatCurrency(data.receita.hoje)}
              icon={<DollarSign className="h-5 w-5" />}
              trendValue={null}
              trendLabel="sem comparação"
              tooltip="Receita total acumulada no dia."
              sparklineData={navMode === 'professional' ? receitaSparkline : undefined}
              valueClassName="font-bold"
            />
            <KpiCard
              title="Receita 7 dias"
              value={formatCurrency(data.receita.ultimos7dias)}
              icon={<DollarSign className="h-5 w-5" />}
              trendValue={null}
              trendLabel="sem comparação"
              tooltip="Receita dos últimos 7 dias."
              sparklineData={navMode === 'professional' ? receitaSparkline : undefined}
              valueClassName="font-bold"
            />
            {navMode === 'professional' && (
              <>
                <KpiCard
                  title="Receita 30 dias"
                  value={formatCurrency(data.receita.ultimos30dias)}
                  icon={<DollarSign className="h-5 w-5" />}
                  trendValue={null}
                  trendLabel="sem comparação"
                  tooltip="Receita dos últimos 30 dias."
                  sparklineData={receitaSparkline}
                  valueClassName="font-bold"
                />
                <KpiCard
                  title="Crescimento"
                  value={formatPercent(data.receita.crescimentoPercentual)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  trendValue={data.receita.crescimentoPercentual}
                  trendLabel="vs período anterior"
                  tooltip="Variação percentual vs 30 dias anteriores."
                  sparklineData={receitaSparkline}
                  valueClassName="font-bold"
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Operação</h2>
              <p className="text-sm text-muted-foreground sm:text-base">Visão do desempenho operacional.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Pedidos Hoje"
                value={data.pedidos.hoje.toLocaleString('pt-BR')}
                icon={<ShoppingBag className="h-5 w-5" />}
                trendValue={null}
                trendLabel="dia atual"
                tooltip="Total de pedidos concluídos hoje."
                sparklineData={pedidosSparkline}
              />
              <KpiCard
                title="Ticket Médio"
                value={formatCurrency(data.ticketMedio.hoje || data.ticketMedio.ultimos30dias)}
                icon={<DollarSign className="h-5 w-5" />}
                trendValue={null}
                trendLabel="média atual"
                tooltip="Receita por pedido."
              />
              <KpiCard
                title="Tempo médio de preparo"
                value="—"
                icon={<RefreshCcw className="h-5 w-5" />}
                trendValue={null}
                trendLabel="indisponível"
                tooltip="Métrica não disponível."
              />
              <KpiCard
                title="Tempo médio de entrega"
                value={data.performanceEntrega ? `${Math.round(data.performanceEntrega.tempoMedioReal)} min` : '—'}
                icon={<RefreshCcw className="h-5 w-5" />}
                trendValue={null}
                trendLabel="tempo real"
                tooltip="Tempo médio de entrega."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Clientes</h2>
              <p className="text-sm text-muted-foreground sm:text-base">Base ativa e fidelização.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Clientes ativos (30d)"
                value={data.clientesAtivos30d.toLocaleString('pt-BR')}
                icon={<Users className="h-5 w-5" />}
                trendValue={null}
                trendLabel="últimos 30 dias"
                tooltip="Clientes com pedidos nos últimos 30 dias."
              />
              <KpiCard
                title="Novos clientes"
                value="—"
                icon={<Users className="h-5 w-5" />}
                trendValue={null}
                trendLabel="indisponível"
                tooltip="Métrica não disponível."
              />
              <KpiCard
                title="Recorrência"
                value={formatPercent(data.taxaRecompra * 100)}
                icon={<RefreshCcw className="h-5 w-5" />}
                trendValue={null}
                trendLabel="30 dias"
                tooltip="Percentual de clientes com mais de um pedido."
              />
              {navMode === 'professional' && (
                <KpiCard
                  title="Clientes em risco"
                  value="—"
                  icon={<AlertCircle className="h-5 w-5" />}
                  trendValue={null}
                  trendLabel="indisponível"
                  tooltip="Disponível quando houver dados."
                />
              )}
            </div>
          </div>

          {navMode === 'professional' && (
            <Card className="rounded-2xl bg-muted/30 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 sm:p-6">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold sm:text-lg">Alertas & Riscos</CardTitle>
                  <p className="text-sm text-muted-foreground sm:text-base">Sinais que merecem atenção imediata.</p>
                </div>
                <div className="rounded-xl bg-background/80 p-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-6 pt-0 sm:px-6">
                <div className="space-y-2">
                  {data.receita.crescimentoPercentual < 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-background/80 p-4">
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                      <p className="text-sm text-foreground sm:text-base">
                        Receita caiu {formatPercent(Math.abs(data.receita.crescimentoPercentual))} vs período anterior.
                      </p>
                    </div>
                  )}
                  {data.ticketMedio.hoje > 0 && data.ticketMedio.ultimos30dias > 0 && data.ticketMedio.hoje < data.ticketMedio.ultimos30dias && (
                    <div className="flex items-start gap-3 rounded-xl bg-background/80 p-4">
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                      <p className="text-sm text-foreground sm:text-base">
                        Ticket médio de hoje abaixo da média de 30 dias.
                      </p>
                    </div>
                  )}
                  {ticketMedio7d > 0 && data.ticketMedio.ultimos30dias > 0 && ticketMedio7d < data.ticketMedio.ultimos30dias && (
                    <div className="flex items-start gap-3 rounded-xl bg-background/80 p-4">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-sm text-foreground sm:text-base">
                        Ticket médio de 7 dias abaixo da média de 30 dias.
                      </p>
                    </div>
                  )}
                  {data.performanceEntrega && data.performanceEntrega.tempoMedioReal > 40 && (
                    <div className="flex items-start gap-3 rounded-xl bg-background/80 p-4">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-sm text-foreground sm:text-base">
                        Tempo médio de entrega acima de 40 min.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="order-5 rounded-2xl bg-muted/30 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 sm:p-6">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold sm:text-lg">Insights Estratégicos</CardTitle>
                <p className="text-sm text-muted-foreground sm:text-base">Sugestões claras para decisões rápidas.</p>
                <p className="text-sm text-muted-foreground sm:text-base">Sugestões claras para decisões rápidas.</p>
              </div>
              <div className="rounded-xl bg-background/80 p-2 text-muted-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-6 pt-0 sm:px-6">
              {insights.map((insight, index) => (
                <div key={`${insight}-${index}`} className="flex items-start gap-3 rounded-xl bg-background/80 p-4">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm text-foreground sm:text-base">{insight}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-sm text-muted-foreground sm:text-base">Nenhum insight disponível no período.</p>
              )}
            </CardContent>
          </Card>
          <div className="order-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-6 rounded-2xl bg-card/70 shadow-sm">
              <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                <CardTitle className="text-base font-semibold sm:text-lg">Distribuição RFM</CardTitle>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Clientes VIP representam {rfmBuckets.total > 0 ? Math.round((rfmBuckets.vip / rfmBuckets.total) * 100) : 0}% do grupo analisado
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-6 pt-0 sm:px-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                    <span>VIP</span>
                    <span>{rfmBuckets.vip} clientes</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60">
                    <div
                      className="h-2 rounded-full bg-foreground/40"
                      style={{
                        width: `${rfmBuckets.total > 0 ? (rfmBuckets.vip / rfmBuckets.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                    <span>Recorrentes</span>
                    <span>{rfmBuckets.recorrentes} clientes</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60">
                    <div
                      className="h-2 rounded-full bg-foreground/30"
                      style={{
                        width: `${rfmBuckets.total > 0 ? (rfmBuckets.recorrentes / rfmBuckets.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                    <span>Novos</span>
                    <span>{rfmBuckets.novos} clientes</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60">
                    <div
                      className="h-2 rounded-full bg-foreground/20"
                      style={{
                        width: `${rfmBuckets.total > 0 ? (rfmBuckets.novos / rfmBuckets.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                {rfmBuckets.total === 0 && (
                  <p className="text-sm text-muted-foreground sm:text-base">Nenhum dado disponível para análise de RFM.</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 rounded-2xl bg-card/70 shadow-sm">
              <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                <CardTitle className="text-base font-semibold sm:text-lg">Taxa de Recompra</CardTitle>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {formatPercent(data.taxaRecompra * 100)} dos clientes ativos compraram mais de uma vez
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-6 pt-0 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold text-foreground sm:text-4xl">
                    {formatPercent(data.taxaRecompra * 100)}
                  </div>
                  <div className="rounded-full bg-muted/40 p-2 text-muted-foreground">
                    <RefreshCcw className="h-5 w-5" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted/60">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${taxaRecompraPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Acompanhe a fidelização para ajustar campanhas e ofertas.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="order-7 space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Performance Operacional</h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Indicadores que impactam a execução diária.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <Card className="lg:col-span-3 rounded-2xl bg-card/70 shadow-sm">
                <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground sm:text-base">Tempo médio de entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pb-6 pt-0 sm:px-6">
                  <div className="text-3xl font-semibold text-foreground sm:text-4xl">
                    {data.performanceEntrega ? `${Math.round(data.performanceEntrega.tempoMedioReal)} min` : '—'}
                  </div>
                  <p className="text-sm text-muted-foreground sm:text-base">Visão executiva do tempo real de operação.</p>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3 rounded-2xl bg-card/70 shadow-sm">
                <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground sm:text-base">Taxa de atraso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pb-6 pt-0 sm:px-6">
                  <div className="text-3xl font-semibold text-foreground sm:text-4xl">
                    {data.performanceEntrega ? `${Math.max(0, Math.round(data.performanceEntrega.diferencaPrevistoReal))} min` : '—'}
                  </div>
                  <p className="text-sm text-muted-foreground sm:text-base">Diferença média entre previsto e realizado.</p>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3 rounded-2xl bg-card/70 shadow-sm">
                <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground sm:text-base">Eficiência Logistics-AI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pb-6 pt-0 sm:px-6">
                  <div className="text-3xl font-semibold text-foreground sm:text-4xl">—</div>
                  <p className="text-sm text-muted-foreground sm:text-base">Métrica disponível quando ativações avançadas estiverem habilitadas.</p>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3 rounded-2xl bg-card/70 shadow-sm">
                <CardHeader className="space-y-1 p-5 pb-3 sm:p-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground sm:text-base">SLA interno</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-5 pb-6 pt-0 sm:px-6">
                  <div className="text-3xl font-semibold text-foreground sm:text-4xl">—</div>
                  <p className="text-sm text-muted-foreground sm:text-base">Disponível quando o SLA for configurado.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
