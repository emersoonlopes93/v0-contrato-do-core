'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { TenantSettingsDTO } from '@/src/types/tenant-settings';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  OrdersOrderDTO,
} from '@/src/types/orders';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';

export type OrderDetailsPageProps = {
  orderId: string;
};

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

function formatCurrency(value: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency ?? 'BRL' }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function OrderDetailsPageContent({ orderId }: OrderDetailsPageProps) {
  const { tenantSlug } = useTenant();
  const { tenantSettings: tenantSettingsSession } = useSession();
  const [order, setOrder] = useState<OrdersOrderDTO | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<OrdersOrderDTO>(`/api/v1/tenant/orders/${orderId}`, tenantSlug);
        if (cancelled) return;
        setOrder(data);

        try {
          const settings = await apiGet<TenantSettingsDTO | null>('/api/v1/tenant/settings', tenantSlug);
          if (!cancelled) setTenantSettings(settings);
        } catch {
          if (!cancelled) setTenantSettings(null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar pedido');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, tenantSlug]);

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, (envelope) => {
    if (!tenantSlug || !order) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    if (envelope.payload.orderId !== orderId) return;
    
    // Atualiza o status do pedido em tempo real
    setOrder((prev) => {
      if (!prev) return prev;
      return { ...prev, status: envelope.payload.status };
    });
  });

  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, i) => sum + i.totalPrice, 0);
  }, [order]);

  const basePath = `/tenant/${tenantSlug}`;
  const effectiveTimezone = tenantSettings?.timezone ?? tenantSettingsSession?.timezone ?? null;
  const showSettingsWarning =
    tenantSettings === null ||
    tenantSettings.addressCity === null ||
    tenantSettings.addressState === null ||
    tenantSettings.latitude === null ||
    tenantSettings.longitude === null ||
    effectiveTimezone === null;
  return (
    <PermissionGuard permission="orders.read">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Detalhes do Pedido</h1>
            <p className="text-muted-foreground">{order ? `#${order.orderNumber}` : orderId}</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = `${basePath}/orders`)}>
            Voltar
          </Button>
        </div>

        {showSettingsWarning && (
          <Alert>
            <AlertDescription>
              Configurações da loja incompletas (endereço/lat/long/timezone). Preencha em{' '}
              <a href={`${basePath}/settings`} className="underline underline-offset-4">
                Configurações
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : !order ? (
          <Card>
            <CardHeader>
              <CardTitle>Pedido não encontrado</CardTitle>
              <CardDescription>Verifique o ID e tente novamente.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Itens</CardTitle>
                  <CardDescription>{order.items.length} item(ns)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.items.map((i) => (
                    <div key={i.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {i.quantity}x {i.name}
                          </div>
                          {i.notes && <div className="text-sm text-muted-foreground">{i.notes}</div>}
                        </div>
                        <div className="text-sm font-medium">{formatCurrency(i.totalPrice, tenantSettings?.currency ?? null)}</div>
                      </div>

                      {i.modifiers.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="text-muted-foreground">Complementos</div>
                          <div className="text-muted-foreground">
                            {i.modifiers
                              .map((m) => `${m.name}${m.priceDelta !== 0 ? ` (${formatCurrency(m.priceDelta, tenantSettings?.currency ?? null)})` : ''}`)
                              .join(' · ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Mudanças de status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {order.timelineEvents.length === 0 ? (
                    <div className="text-muted-foreground">Sem eventos</div>
                  ) : (
                    order.timelineEvents.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                        <div className="text-muted-foreground">
                          {e.fromStatus ? `${e.fromStatus} → ` : ''}
                          <span className="font-medium text-foreground">{e.toStatus}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(e.timestamp, effectiveTimezone)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>{order.source}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Criado</span>
                    <span className="font-medium">{formatDateTime(order.createdAt, effectiveTimezone)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total itens</span>
                    <span className="font-medium">{formatCurrency(itemsTotal, tenantSettings?.currency ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total pedido</span>
                    <span className="font-medium">{formatCurrency(order.total, tenantSettings?.currency ?? null)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                  <CardDescription>Informações do pedido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{order.customerName ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telefone</span>
                    <span className="font-medium">{order.customerPhone ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className="font-medium">{order.deliveryType ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pagamento</span>
                    <span className="font-medium">{order.paymentMethod ?? '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const OrderDetailsPage = withModuleGuard(OrderDetailsPageContent, 'orders-module');
