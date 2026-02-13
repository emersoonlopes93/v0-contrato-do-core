'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useKdsOrders } from '@/src/modules/kds/src/hooks/useKdsOrders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ORDERS_OPERATIONAL_STATUS, ORDERS_STATUS_LABELS } from '@/src/types/orders';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import { KdsOrderCard } from '@/src/modules/kds/src/components/KdsOrderCard';

type KdsColumn = {
  key: string;
  title: string;
  statuses: string[];
};

const KDS_COLUMNS: KdsColumn[] = [
  {
    key: 'new',
    title: 'Novos',
    statuses: [ORDERS_OPERATIONAL_STATUS.NEW, ORDERS_OPERATIONAL_STATUS.ACCEPTED],
  },
  {
    key: 'preparing',
    title: ORDERS_STATUS_LABELS.preparing ?? 'Em preparo',
    statuses: [ORDERS_OPERATIONAL_STATUS.PREPARING],
  },
  {
    key: 'ready',
    title: ORDERS_STATUS_LABELS.ready ?? 'Pronto',
    statuses: [ORDERS_OPERATIONAL_STATUS.READY],
  },
];

function KdsPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings } = useSession();
  const kdsEnabled = tenantSettings?.kdsEnabled ?? true;
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const { orders, loading, error, updateError, updatingOrderIds, highlightOrderIds, updateStatus, reload } = useKdsOrders(
    tenantSlug,
    { enabled: kdsEnabled, realtimeEnabled },
  );

  const basePath = `/tenant/${tenantSlug}`;

  const ordersByColumn = React.useMemo(() => {
    const map = new Map<string, OrdersOrderSummaryDTO[]>();
    for (const column of KDS_COLUMNS) {
      map.set(column.key, []);
    }
    for (const order of orders) {
      const column = KDS_COLUMNS.find((c) => c.statuses.includes(order.status));
      if (!column) continue;
      const list = map.get(column.key);
      if (list) list.push(order);
    }
    return map;
  }, [orders]);

  const hasOrders = ordersByColumn.size > 0 && [...ordersByColumn.values()].some((list) => list.length > 0);

  return (
    <PermissionGuard permission="kds.view">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">KDS</h1>
            <p className="text-muted-foreground">Acompanhe pedidos em tempo real na cozinha</p>
          </div>
          <div className="flex items-center gap-2">
            {realtimeEnabled && (
              <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </div>
            )}
            <Button variant="outline" onClick={() => (window.location.href = `${basePath}/orders`)}>
              Ver lista completa
            </Button>
          </div>
        </div>

        {!kdsEnabled && (
          <Alert>
            <AlertDescription>KDS desativado nas configurações do tenant.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {updateError && !error && (
          <Alert variant="destructive">
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando pedidos...</div>
        ) : !hasOrders ? (
          <Card>
            <CardHeader>
              <CardTitle>Sem pedidos no momento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Aguardando novos pedidos para a cozinha.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {KDS_COLUMNS.map((column) => {
              const list = ordersByColumn.get(column.key) ?? [];
              return (
                <div key={column.key} className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                    <div className="font-semibold">{column.title}</div>
                    <div className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {list.length}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {list.map((order) => (
                      <KdsOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={updateStatus}
                        isUpdating={updatingOrderIds.includes(order.id) || !kdsEnabled}
                        highlight={highlightOrderIds.includes(order.id)}
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

export const KdsPage = withModuleGuard(KdsPageContent, 'kds');
