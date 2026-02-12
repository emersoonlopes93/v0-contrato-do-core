'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { FinancialOrderDTO, FinancialOrdersListDTO, FinancialSummaryDTO } from '@/src/types/financial';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiGet<T>(url: string, tenantSlug: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function formatCurrency(value: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency ?? 'BRL' }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function formatDateTime(value: string, timezone: string | null): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone ?? undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

function FinancialDashboardPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings } = useSession();
  const [summary, setSummary] = useState<FinancialSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<FinancialSummaryDTO>('/api/v1/financial/summary', tenantSlug);
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar resumo financeiro');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const basePath = `/tenant/${tenantSlug}`;
  const currency: string | null = null;
  const lastUpdated = summary ? formatDateTime(summary.updatedAt, tenantSettings?.timezone ?? null) : null;

  return (
    <PermissionGuard permission="financial.summary.read">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Financeiro</h1>
            <p className="text-muted-foreground">Resumo financeiro consolidado</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = `${basePath}/financial/orders`)}>
              Ver pedidos pagos
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : !summary ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum dado financeiro</CardTitle>
              <CardDescription>Ainda não existem pagamentos processados para este tenant.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total recebido</CardTitle>
                  <CardDescription>Pagamentos concluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {formatCurrency(summary.totalPaid, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Receita líquida</CardTitle>
                  <CardDescription>Após taxas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {formatCurrency(summary.netAmount, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos pagos</CardTitle>
                  <CardDescription>Total de pedidos confirmados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{summary.totalOrders}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Em aberto</CardTitle>
                  <CardDescription>Pagamentos pendentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatCurrency(summary.totalPending, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cancelados</CardTitle>
                  <CardDescription>Pagamentos cancelados ou falhos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatCurrency(summary.totalCancelled, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Reembolsados</CardTitle>
                  <CardDescription>Valores devolvidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatCurrency(summary.totalRefunded, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Taxas</CardTitle>
                  <CardDescription>Taxas de processamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {formatCurrency(summary.totalFees, currency)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Atualizado em {lastUpdated}
              </p>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

function FinancialOrdersPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings } = useSession();
  const [orders, setOrders] = useState<FinancialOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<FinancialOrdersListDTO>(
          '/api/v1/financial/orders?page=1&pageSize=20',
          tenantSlug,
        );
        if (!cancelled) setOrders(data.items);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos pagos');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const basePath = `/tenant/${tenantSlug}`;
  const currency: string | null = null;
  const timezone = tenantSettings?.timezone ?? null;

  const ordered = useMemo(() => {
    return [...orders].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [orders]);

  const hasOrders = ordered.length > 0;

  return (
    <PermissionGuard permission="financial.orders.read">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pedidos pagos</h1>
            <p className="text-muted-foreground">Lista de pedidos com pagamento concluído</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = `${basePath}/financial`)}>
              Ver resumo
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : !hasOrders ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum pedido pago</CardTitle>
              <CardDescription>Ainda não existem pedidos pagos para este tenant.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3">
            {ordered.map((o) => (
              <Card
                key={o.paymentId}
                className="cursor-pointer"
                onClick={() => (window.location.href = `${basePath}/orders/${o.orderId}`)}
              >
                <CardHeader>
                  <CardTitle className="text-base">
                    Pedido #{o.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    {o.paymentMethod.toUpperCase()} · {o.paymentProvider} ·{' '}
                    {formatDateTime(o.paidAt, timezone)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    Criado em {formatDateTime(o.createdAt, timezone)}
                  </div>
                  <div className="font-medium">
                    {formatCurrency(o.total, currency)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const FinancialDashboardPage = withModuleGuard(FinancialDashboardPageContent, 'financial');
export const FinancialOrdersPage = withModuleGuard(FinancialOrdersPageContent, 'financial');
