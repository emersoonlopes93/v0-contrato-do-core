'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useDeliveryRoutes } from '@/src/modules/delivery-routes/src/hooks/useDeliveryRoutes';
import type { DeliveryRouteStopDTO } from '@/src/types/delivery-routes';
import { ORDERS_STATUS_LABELS } from '@/src/types/orders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StopInputState = {
  latitude: string;
  longitude: string;
  label: string;
};

function formatDistance(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)} km`;
}

function formatEta(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value)} min`;
}

function DeliveryRoutesPageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken, tenantSettings, hasPermission } = useSession();
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const canManage = hasPermission('delivery-routes.manage');
  const { routes, orders, loading, error, create, remove, reload } = useDeliveryRoutes(accessToken, tenantSlug, {
    realtimeEnabled,
  });

  const [routeName, setRouteName] = React.useState('');
  const [selectedOrders, setSelectedOrders] = React.useState<string[]>([]);
  const [stopInputs, setStopInputs] = React.useState<Record<string, StopInputState>>({});

  const openOrders = React.useMemo(() => {
    return orders.filter(
      (order) =>
        order.status !== 'completed' &&
        order.status !== 'cancelled' &&
        order.status !== 'delivered' &&
        order.status !== 'canceled',
    );
  }, [orders]);

  const selectedStops: DeliveryRouteStopDTO[] = React.useMemo(() => {
    return selectedOrders.map((orderId, index) => {
      const input = stopInputs[orderId];
      const lat = input?.latitude ? Number(input.latitude) : null;
      const lng = input?.longitude ? Number(input.longitude) : null;
      return {
        orderId,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
        label: input?.label?.trim() || null,
        sequence: index + 1,
        distanceKm: null,
        etaMinutes: null,
      };
    });
  }, [selectedOrders, stopInputs]);

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="delivery-routes.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Roteirização</h1>
          <p className="text-muted-foreground">Agrupe pedidos e estime rotas de entrega</p>
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Criar nova rota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da rota</Label>
                <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Rota Centro / Bairro" />
              </div>

              <div className="space-y-3">
                <Label>Pedidos disponíveis</Label>
                {openOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum pedido disponível para rota.</div>
                ) : (
                  <div className="space-y-2">
                    {openOrders.map((order) => {
                      const checked = selectedOrders.includes(order.id);
                      return (
                        <label key={order.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedOrders, order.id]
                                : selectedOrders.filter((id) => id !== order.id);
                              setSelectedOrders(next);
                            }}
                            disabled={!canManage}
                          />
                          <span>
                            #{order.orderNumber} • {ORDERS_STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedOrders.length > 0 && (
                <div className="space-y-3">
                  <Label>Coordenadas por pedido</Label>
                  <div className="space-y-3">
                    {selectedOrders.map((orderId) => {
                      const current = stopInputs[orderId] ?? { latitude: '', longitude: '', label: '' };
                      return (
                        <div key={orderId} className="rounded-md border p-3 space-y-2">
                          <div className="text-xs text-muted-foreground">Pedido {orderId}</div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              value={current.label}
                              onChange={(e) =>
                                setStopInputs((prev) => ({
                                  ...prev,
                                  [orderId]: { ...current, label: e.target.value },
                                }))
                              }
                              placeholder="Identificação"
                            />
                            <Input
                              value={current.latitude}
                              onChange={(e) =>
                                setStopInputs((prev) => ({
                                  ...prev,
                                  [orderId]: { ...current, latitude: e.target.value },
                                }))
                              }
                              placeholder="Latitude"
                            />
                            <Input
                              value={current.longitude}
                              onChange={(e) =>
                                setStopInputs((prev) => ({
                                  ...prev,
                                  [orderId]: { ...current, longitude: e.target.value },
                                }))
                              }
                              placeholder="Longitude"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => {
                  const name = routeName.trim() || `Rota ${new Date().toLocaleDateString('pt-BR')}`;
                  if (selectedOrders.length === 0) return;
                  void create(
                    {
                      name,
                      orderIds: selectedOrders,
                      stops: selectedStops.map((stop) => ({
                        orderId: stop.orderId,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        label: stop.label,
                      })),
                    },
                  );
                  setRouteName('');
                  setSelectedOrders([]);
                  setStopInputs({});
                }}
                disabled={!canManage}
              >
                Gerar rota
              </Button>
              {!canManage && (
                <div className="text-xs text-muted-foreground">
                  Você precisa de permissão para criar rotas.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rotas geradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Carregando rotas...</div>
              ) : routes.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma rota criada.</div>
              ) : (
                <div className="space-y-4">
                  {routes.map((route) => (
                    <div key={route.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{route.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {route.stops.length} paradas
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {route.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Distância: {formatDistance(route.totalDistanceKm)}</span>
                        <span>Tempo: {formatEta(route.totalEtaMinutes)}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {route.stops.map((stop) => (
                          <div key={`${route.id}-${stop.orderId}`} className="flex items-center justify-between gap-2">
                            <span>
                              {stop.sequence}. Pedido {stop.orderId}
                              {stop.label ? ` • ${stop.label}` : ''}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDistance(stop.distanceKm)} • {formatEta(stop.etaMinutes)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remove(route.id)}
                        disabled={!canManage}
                      >
                        Remover rota
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const DeliveryRoutesPage = withModuleGuard(DeliveryRoutesPageContent, 'delivery-routes');
