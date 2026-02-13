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
  createDriver: (input: { name: string; phone: string | null }) => Promise<void>;
  updateDriver: (driverId: string, input: { name?: string; phone?: string | null }) => Promise<void>;
  updateStatus: (driverId: string, status: DeliveryDriverStatus) => Promise<void>;
  assignOrder: (driverId: string, orderId: string | null) => Promise<void>;
  reload: (withLoading?: boolean) => Promise<void>;
};

type Options = {
  realtimeEnabled?: boolean;
};

async function buildHistoryMap(
  tenantSlug: string,
  drivers: DeliveryDriverDTO[],
): Promise<Record<string, DeliveryDriverHistoryEntryDTO[]>> {
  const entries = await Promise.all(
    drivers.map(async (driver) => [driver.id, await listDeliveryDriverHistory(tenantSlug, driver.id)] as const),
  );
  return entries.reduce<Record<string, DeliveryDriverHistoryEntryDTO[]>>((acc, [id, history]) => {
    acc[id] = history;
    return acc;
  }, {});
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
        const nextDrivers = await listDeliveryDrivers(tenantSlug);
        const nextOrders = await listOrders(tenantSlug);
        setDrivers(nextDrivers);
        setOrders(nextOrders);
        setHistoryByDriver(await buildHistoryMap(tenantSlug, nextDrivers));
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
    async (input: { name: string; phone: string | null }) => {
      const created = await createDeliveryDriver(tenantSlug, input);
      setDrivers((prev) => [...prev, created]);
      const history = await listDeliveryDriverHistory(tenantSlug, created.id);
      setHistoryByDriver((prev) => ({
        ...prev,
        [created.id]: history,
      }));
    },
    [tenantSlug],
  );

  const updateDriver = React.useCallback(
    async (driverId: string, input: { name?: string; phone?: string | null }) => {
      const updated = await updateDeliveryDriver(tenantSlug, driverId, {
        name: input.name,
        phone: input.phone,
      });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
    },
    [tenantSlug],
  );

  const updateStatus = React.useCallback(
    async (driverId: string, status: DeliveryDriverStatus) => {
      const updated = await updateDeliveryDriver(tenantSlug, driverId, { status });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
    },
    [tenantSlug],
  );

  const assignOrder = React.useCallback(
    async (driverId: string, orderId: string | null) => {
      const updated = await assignDeliveryOrder(tenantSlug, { driverId, orderId });
      setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
      const history = await listDeliveryDriverHistory(tenantSlug, driverId);
      setHistoryByDriver((prev) => ({
        ...prev,
        [driverId]: history,
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
    void (async () => {
      const updated = await syncDriverWithOrderStatus({
        tenantSlug,
        orderId: envelope.payload.orderId,
        status: envelope.payload.status,
      });
      if (updated) {
        setDrivers((prev) => prev.map((driver) => (driver.id === updated.id ? updated : driver)));
        const history = await listDeliveryDriverHistory(tenantSlug, updated.id);
        setHistoryByDriver((prev) => ({
          ...prev,
          [updated.id]: history,
        }));
      }
    })();
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
