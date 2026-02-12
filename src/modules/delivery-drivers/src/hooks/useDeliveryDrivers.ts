import React from 'react';
import type {
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverStatus,
} from '@/src/types/delivery-drivers';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { listOrders } from '../repositories/ordersRepository';
import {
  assignDeliveryOrder,
  createDeliveryDriver,
  listDeliveryDriverHistory,
  listDeliveryDrivers,
  syncDriverWithOrderStatus,
  updateDeliveryDriver,
} from '../services/deliveryDriversService';

type State = {
  drivers: DeliveryDriverDTO[];
  orders: OrdersOrderSummaryDTO[];
  historyByDriver: Record<string, DeliveryDriverHistoryEntryDTO[]>;
  loading: boolean;
  error: string | null;
  createDriver: (input: { name: string; phone: string | null }) => void;
  updateDriver: (driverId: string, input: { name?: string; phone?: string | null }) => void;
  updateStatus: (driverId: string, status: DeliveryDriverStatus) => void;
  assignOrder: (driverId: string, orderId: string | null) => void;
  reload: (withLoading?: boolean) => Promise<void>;
};

type Options = {
  realtimeEnabled?: boolean;
};

function buildHistoryMap(
  tenantSlug: string,
  drivers: DeliveryDriverDTO[],
): Record<string, DeliveryDriverHistoryEntryDTO[]> {
  const map: Record<string, DeliveryDriverHistoryEntryDTO[]> = {};
  drivers.forEach((driver) => {
    map[driver.id] = listDeliveryDriverHistory(tenantSlug, driver.id);
  });
  return map;
}

export function useDeliveryDrivers(
  tenantSlug: string,
  options?: Options,
): State {
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [drivers, setDrivers] = React.useState<DeliveryDriverDTO[]>([]);
  const [orders, setOrders] = React.useState<OrdersOrderSummaryDTO[]>([]);
  const [historyByDriver, setHistoryByDriver] = React.useState<
    Record<string, DeliveryDriverHistoryEntryDTO[]>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (withLoading = true) => {
      if (withLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const nextDrivers = listDeliveryDrivers(tenantSlug);
        const nextOrders = await listOrders(tenantSlug);
        setDrivers(nextDrivers);
        setOrders(nextOrders);
        setHistoryByDriver(buildHistoryMap(tenantSlug, nextDrivers));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar entregadores';
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

  const createDriver = React.useCallback(
    (input: { name: string; phone: string | null }) => {
      const created = createDeliveryDriver(tenantSlug, input);
      setDrivers((prev) => [...prev, created]);
      setHistoryByDriver((prev) => ({
        ...prev,
        [created.id]: listDeliveryDriverHistory(tenantSlug, created.id),
      }));
    },
    [tenantSlug],
  );

  const updateDriver = React.useCallback(
    (driverId: string, input: { name?: string; phone?: string | null }) => {
      const updated = updateDeliveryDriver(tenantSlug, driverId, {
        name: input.name,
        phone: input.phone,
      });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
    },
    [tenantSlug],
  );

  const updateStatus = React.useCallback(
    (driverId: string, status: DeliveryDriverStatus) => {
      const updated = updateDeliveryDriver(tenantSlug, driverId, { status });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
    },
    [tenantSlug],
  );

  const assignOrder = React.useCallback(
    (driverId: string, orderId: string | null) => {
      const updated = assignDeliveryOrder(tenantSlug, { driverId, orderId });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
      setHistoryByDriver((prev) => ({
        ...prev,
        [driverId]: listDeliveryDriverHistory(tenantSlug, driverId),
      }));
    },
    [tenantSlug],
  );

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, () => {
    if (!realtimeEnabled) return;
    void load(false);
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, (envelope) => {
    if (!realtimeEnabled) return;
    const updated = syncDriverWithOrderStatus({
      tenantSlug,
      orderId: envelope.payload.orderId,
      status: envelope.payload.status,
    });
    if (updated) {
      setDrivers((prev) => prev.map((driver) => (driver.id === updated.id ? updated : driver)));
      setHistoryByDriver((prev) => ({
        ...prev,
        [updated.id]: listDeliveryDriverHistory(tenantSlug, updated.id),
      }));
    }
    void load(false);
  });

  return {
    drivers,
    orders,
    historyByDriver,
    loading,
    error,
    createDriver,
    updateDriver,
    updateStatus,
    assignOrder,
    reload: load,
  };
}
