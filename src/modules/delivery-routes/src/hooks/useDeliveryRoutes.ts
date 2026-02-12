import React from 'react';
import type {
  DeliveryRouteCreateRequest,
  DeliveryRouteDTO,
  DeliveryRouteOptimizationOptions,
} from '@/src/types/delivery-routes';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { listOrders } from '../repositories/ordersRepository';
import { createRoute, deleteRoute, listAllRoutes } from '../services/deliveryRoutesService';

type State = {
  routes: DeliveryRouteDTO[];
  orders: OrdersOrderSummaryDTO[];
  loading: boolean;
  error: string | null;
  create: (input: DeliveryRouteCreateRequest, options?: DeliveryRouteOptimizationOptions) => Promise<void>;
  remove: (routeId: string) => void;
  reload: (withLoading?: boolean) => Promise<void>;
};

type Options = {
  realtimeEnabled?: boolean;
};

export function useDeliveryRoutes(
  tenantSlug: string,
  options?: Options,
): State {
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [routes, setRoutes] = React.useState<DeliveryRouteDTO[]>([]);
  const [orders, setOrders] = React.useState<OrdersOrderSummaryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (withLoading = true) => {
      if (withLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const nextOrders = await listOrders(tenantSlug);
        const nextRoutes = await listAllRoutes(tenantSlug);
        setOrders(nextOrders);
        setRoutes(nextRoutes);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar rotas';
        setError(message);
      } finally {
        if (withLoading) setLoading(false);
      }
    },
    [tenantSlug],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = React.useCallback(
    async (input: DeliveryRouteCreateRequest, options?: DeliveryRouteOptimizationOptions) => {
      const created = await createRoute(tenantSlug, input, options);
      setRoutes((prev) => [created, ...prev]);
    },
    [tenantSlug],
  );

  const remove = React.useCallback(
    (routeId: string) => {
      deleteRoute(tenantSlug, routeId);
      setRoutes((prev) => prev.filter((route) => route.id !== routeId));
    },
    [tenantSlug],
  );

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, () => {
    if (!realtimeEnabled) return;
    void load(false);
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, () => {
    if (!realtimeEnabled) return;
    void load(false);
  });

  return {
    routes,
    orders,
    loading,
    error,
    create,
    remove,
    reload: load,
  };
}
