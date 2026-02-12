'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderCard } from '@/src/tenant/components/cards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { TenantSettingsDTO } from '@/src/types/tenant-settings';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';
import { REALTIME_ORDER_EVENTS, REALTIME_PAYMENT_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import type { OrdersListUpdatableEvent } from '@/src/types/realtime';

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

function OrdersPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings: tenantSettingsSession } = useSession();

  const [orders, setOrders] = useState<OrdersOrderSummaryDTO[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const hasOrders = orders.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<OrdersOrderSummaryDTO[]>('/api/v1/tenant/orders', tenantSlug);
        if (cancelled) return;
        setOrders(data);

        try {
          const settings = await apiGet<TenantSettingsDTO | null>('/api/v1/tenant/settings', tenantSlug);
          if (!cancelled) setTenantSettings(settings);
        } catch {
          if (!cancelled) setTenantSettings(null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const handleRealtimeUpdate = useCallback(
    (event: OrdersListUpdatableEvent, payload: { orderId: string; status?: string }) => {
      if (event === REALTIME_ORDER_EVENTS.ORDER_CREATED) {
        // Para order.created, buscamos os detalhes do pedido
        apiGet<OrdersOrderSummaryDTO>(`/api/v1/tenant/orders/${payload.orderId}`, tenantSlug)
          .then((newOrder) => {
            setOrders((prev) => {
              const existingIndex = prev.findIndex((o) => o.id === payload.orderId);
              if (existingIndex !== -1) return prev;
              return [...prev, newOrder];
            });
          })
          .catch(() => {
            // Silenciosamente ignora erros de busca
          });
        return;
      }
      setOrders((prev) => {
        const existingIndex = prev.findIndex((o) => o.id === payload.orderId);
        if (event === REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED) {
          if (existingIndex === -1) return prev;
          const next = [...prev];
          const current = next[existingIndex];
          const nextStatus = payload.status ?? current.status;
          next[existingIndex] = { ...current, status: nextStatus };
          return next;
        }
        if (
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_CONFIRMED ||
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_FAILED ||
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_EXPIRED
        ) {
          return prev;
        }
        return prev;
      });
    },
    [tenantSlug],
  );

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_CREATED, {
      orderId: envelope.payload.orderId,
    });
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    const status = envelope.payload.status;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: envelope.payload.orderId,
      status,
    });
  });

  const ordered = useMemo(() => {
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders]);

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
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pedidos</h1>
            <p className="text-muted-foreground">Lista de pedidos do tenant</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = `${basePath}/orders/kanban`)}>
              Kanban
            </Button>
          </div>
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
        ) : !hasOrders ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum pedido</CardTitle>
              <CardDescription>Ainda não existem pedidos cadastrados.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3">
            {ordered.map((o) => (
              <OrderCard
                key={o.id}
                variant="full"
                orderNumber={o.orderNumber}
                status={o.status}
                total={o.total}
                itemsCount={o.itemsCount}
                createdAt={o.createdAt}
                source={o.source}
                currency={tenantSettings?.currency ?? 'BRL'}
                timezone={effectiveTimezone}
                onClick={() => (window.location.href = `${basePath}/orders/${o.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const OrdersPage = withModuleGuard(OrdersPageContent, 'orders-module');
