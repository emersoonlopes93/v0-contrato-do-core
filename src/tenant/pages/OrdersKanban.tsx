'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { OrderCard, StatusBadge } from '@/src/tenant/components/cards';
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
import type { OrdersKanbanUpdatableEvent } from '@/src/types/realtime';

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

type KanbanColumn = {
  key: string;
  title: string;
};

const COLUMNS: KanbanColumn[] = [
  { key: 'created', title: 'Criado' },
  { key: 'accepted', title: 'Aceito' },
  { key: 'preparing', title: 'Preparando' },
  { key: 'ready', title: 'Pronto' },
  { key: 'completed', title: 'Concluído' },
  { key: 'cancelled', title: 'Cancelado' },
];

function OrdersKanbanPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings: tenantSettingsSession } = useSession();
  const [orders, setOrders] = useState<OrdersOrderSummaryDTO[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
    (event: OrdersKanbanUpdatableEvent, payload: { orderId: string; status?: string }) => {
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

  const byStatus = useMemo(() => {
    const map = new Map<string, OrdersOrderSummaryDTO[]>();
    for (const c of COLUMNS) map.set(c.key, []);
    for (const o of orders) {
      const key = map.has(o.status) ? o.status : 'created';
      const current = map.get(key);
      if (current) current.push(o);
    }
    for (const c of COLUMNS) {
      const list = map.get(c.key) ?? [];
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      map.set(c.key, list);
    }
    return map;
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pedidos (Kanban)</h1>
            <p className="text-muted-foreground">Visão por status</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = `${basePath}/orders`)}>
            Lista
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
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {COLUMNS.map((c) => {
              const list = byStatus.get(c.key) ?? [];
              return (
                <div key={c.key} className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{c.title}</div>
                      <StatusBadge status={c.key} label="" className="h-2 w-2 p-0" />
                    </div>
                    <div className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {list.length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {list.map((o) => (
                      <OrderCard
                        key={o.id}
                        variant="compact"
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const OrdersKanbanPage = withModuleGuard(OrdersKanbanPageContent, 'orders-module');
