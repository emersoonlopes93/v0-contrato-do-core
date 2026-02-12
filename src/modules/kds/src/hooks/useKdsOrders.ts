import React from 'react';
import { changeKdsOrderStatus, fetchKdsOrders } from '@/src/modules/kds/src/services/kdsService';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';

type KdsState = {
  orders: OrdersOrderSummaryDTO[];
  loading: boolean;
  error: string | null;
  updateError: string | null;
  updatingOrderIds: string[];
  highlightOrderIds: string[];
  reload: () => Promise<void>;
  updateStatus: (orderId: string, status: string) => Promise<void>;
};

type KdsOptions = {
  enabled?: boolean;
  realtimeEnabled?: boolean;
};

export function useKdsOrders(tenantSlug: string, options?: KdsOptions): KdsState {
  const enabled = options?.enabled ?? true;
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [orders, setOrders] = React.useState<OrdersOrderSummaryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [updatingOrderIds, setUpdatingOrderIds] = React.useState<string[]>([]);
  const [highlightOrderIds, setHighlightOrderIds] = React.useState<string[]>([]);
  const realtimeReloadRef = React.useRef<number | null>(null);
  const highlightTimeoutsRef = React.useRef<Record<string, number>>({});

  const load = React.useCallback(async (withLoading = true) => {
    if (!enabled) return;
    if (withLoading) {
      setLoading(true);
    }
    if (withLoading) {
      setError(null);
    }
    try {
      const data = await fetchKdsOrders(tenantSlug);
      setOrders(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar pedidos';
      setError(message);
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  }, [enabled, tenantSlug]);

  const updateStatus = React.useCallback(
    async (orderId: string, status: string) => {
      if (!enabled) return;
      if (updatingOrderIds.includes(orderId)) return;
      setUpdateError(null);
      setUpdatingOrderIds((prev) => [...prev, orderId]);
      try {
        const updated = await changeKdsOrderStatus(tenantSlug, orderId, status);
        setOrders((prev) =>
          prev.map((order) => (order.id === updated.id ? { ...order, status: updated.status } : order)),
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erro ao atualizar pedido';
        setUpdateError(message);
      } finally {
        setUpdatingOrderIds((prev) => prev.filter((id) => id !== orderId));
      }
    },
    [enabled, tenantSlug, updatingOrderIds],
  );

  React.useEffect(() => {
    if (!enabled) return undefined;
    void load();
    const timer = window.setInterval(() => {
      void load(false);
    }, realtimeEnabled ? 60000 : 15000);
    return () => window.clearInterval(timer);
  }, [enabled, load, realtimeEnabled]);

  React.useEffect(() => {
    return () => {
      if (realtimeReloadRef.current) {
        window.clearTimeout(realtimeReloadRef.current);
      }
      Object.values(highlightTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      highlightTimeoutsRef.current = {};
    };
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      setOrders([]);
      setLoading(false);
      setError(null);
      setUpdateError(null);
      setUpdatingOrderIds([]);
      setHighlightOrderIds([]);
    }
  }, [enabled]);

  const scheduleReload = React.useCallback(() => {
    if (realtimeReloadRef.current) return;
    realtimeReloadRef.current = window.setTimeout(() => {
      realtimeReloadRef.current = null;
      void load(false);
    }, 250);
  }, [load]);

  const highlightOrder = React.useCallback((orderId: string) => {
    setHighlightOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      return [...prev, orderId];
    });
    const existing = highlightTimeoutsRef.current[orderId];
    if (existing) window.clearTimeout(existing);
    highlightTimeoutsRef.current[orderId] = window.setTimeout(() => {
      setHighlightOrderIds((prev) => prev.filter((id) => id !== orderId));
      delete highlightTimeoutsRef.current[orderId];
    }, 8000);
  }, []);

  const handleRealtime = React.useCallback(
    (orderId?: string) => {
      if (!realtimeEnabled || !enabled) return;
      if (orderId) {
        highlightOrder(orderId);
      }
      scheduleReload();
    },
    [enabled, highlightOrder, realtimeEnabled, scheduleReload],
  );

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, (envelope) => {
    handleRealtime(envelope.payload.orderId);
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, (envelope) => {
    handleRealtime(envelope.payload.orderId);
  });

  return {
    orders,
    loading,
    error,
    updateError,
    updatingOrderIds,
    highlightOrderIds,
    reload: load,
    updateStatus,
  };
}
