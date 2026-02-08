'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useDeliveryDrivers } from '@/src/modules/delivery-drivers/src/hooks/useDeliveryDrivers';
import type { DeliveryDriverHistoryEntryDTO, DeliveryDriverStatus } from '@/src/types/delivery-drivers';
import { ORDERS_STATUS_LABELS } from '@/src/types/orders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_LABELS: Record<DeliveryDriverStatus, string> = {
  available: 'Disponível',
  delivering: 'Em entrega',
  offline: 'Offline',
};

const STATUS_VARIANTS: Record<DeliveryDriverStatus, { variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  available: { variant: 'default', className: 'bg-emerald-500 text-white hover:bg-emerald-500/90' },
  delivering: { variant: 'secondary', className: 'bg-amber-500 text-white hover:bg-amber-500/90' },
  offline: { variant: 'outline', className: 'text-muted-foreground border-muted-foreground/40' },
};

function formatHistoryItem(item: DeliveryDriverHistoryEntryDTO): string {
  const label = item.status === 'delivering' ? 'Despachado' : 'Finalizado';
  return `${label} • ${item.orderId}`;
}

function DeliveryDriversPageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken, tenantSettings, hasPermission } = useSession();
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const canManage = hasPermission('delivery-drivers.manage');
  const canAssign = hasPermission('delivery-drivers.assign');
  const {
    drivers,
    orders,
    historyByDriver,
    loading,
    error,
    createDriver,
    updateStatus,
    assignOrder,
    reload,
  } = useDeliveryDrivers(accessToken, tenantSlug, { realtimeEnabled });

  const [driverName, setDriverName] = React.useState('');
  const [driverPhone, setDriverPhone] = React.useState('');

  const openOrders = React.useMemo(() => {
    return orders.filter(
      (order) =>
        order.status !== 'completed' &&
        order.status !== 'cancelled' &&
        order.status !== 'delivered' &&
        order.status !== 'canceled',
    );
  }, [orders]);

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="delivery-drivers.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Entregadores</h1>
          <p className="text-muted-foreground">Gestão de entregadores e vinculação de pedidos</p>
        </div>

        {realtimeEnabled && (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Entregadores ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Carregando entregadores...</div>
              ) : drivers.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum entregador cadastrado ainda.</div>
              ) : (
                <div className="space-y-4">
                  {drivers.map((driver) => {
                    const badge = STATUS_VARIANTS[driver.status];
                    const history = historyByDriver[driver.id] ?? [];
                    return (
                      <div key={driver.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold">{driver.name}</div>
                            <div className="text-xs text-muted-foreground">{driver.phone || 'Sem telefone'}</div>
                          </div>
                          <Badge variant={badge.variant} className={badge.className}>
                            {STATUS_LABELS[driver.status]}
                          </Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={driver.status}
                              onValueChange={(value) => updateStatus(driver.id, value as DeliveryDriverStatus)}
                              disabled={!canManage}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pedido vinculado</Label>
                            <Select
                              value={driver.activeOrderId ?? ''}
                              onValueChange={(value) => assignOrder(driver.id, value === '' ? null : value)}
                              disabled={!canAssign}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sem pedido" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Sem pedido</SelectItem>
                                {openOrders.map((order) => (
                                  <SelectItem key={order.id} value={order.id}>
                                    #{order.orderNumber} • {ORDERS_STATUS_LABELS[order.status] ?? order.status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>Histórico recente</Label>
                          {history.length === 0 ? (
                            <div className="text-xs text-muted-foreground">Sem histórico de entregas</div>
                          ) : (
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {history.slice(0, 3).map((entry) => (
                                <div key={entry.id}>{formatHistoryItem(entry)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cadastrar entregador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Nome do entregador" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="(DDD) 00000-0000" />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const name = driverName.trim();
                  if (!name) return;
                  createDriver({ name, phone: driverPhone.trim() ? driverPhone.trim() : null });
                  setDriverName('');
                  setDriverPhone('');
                }}
                disabled={!canManage}
              >
                Adicionar entregador
              </Button>
              {!canManage && (
                <div className="text-xs text-muted-foreground">
                  Você precisa de permissão para cadastrar entregadores.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const DeliveryDriversPage = withModuleGuard(DeliveryDriversPageContent, 'delivery-drivers');
