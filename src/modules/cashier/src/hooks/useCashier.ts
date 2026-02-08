import React from 'react';
import type { CashierSession } from '@/src/types/cashier';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import { closeCashier, fetchCashierOrders, getCashier, openCashier, resetCashier } from '@/src/modules/cashier/src/services/cashierService';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';

type CashierState = {
  session: CashierSession | null;
  orders: OrdersOrderSummaryDTO[];
  loading: boolean;
  error: string | null;
  updateHint: string | null;
  openCashier: (openingAmount: number) => void;
  closeCashier: (closingAmount: number) => void;
  resetCashier: () => void;
  reload: (withLoading?: boolean) => Promise<void>;
};

type CashierOptions = {
  realtimeEnabled?: boolean;
};

export function useCashier(
  accessToken: string | null,
  tenantSlug: string,
  options?: CashierOptions,
): CashierState {
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [session, setSession] = React.useState<CashierSession | null>(() => getCashier(tenantSlug));
  const [orders, setOrders] = React.useState<OrdersOrderSummaryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updateHint, setUpdateHint] = React.useState<string | null>(null);
  const realtimeReloadRef = React.useRef<number | null>(null);
  const hintTimerRef = React.useRef<number | null>(null);

  const load = React.useCallback(async (withLoading = true) => {
    if (!accessToken) return;
    if (withLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchCashierOrders(accessToken);
      setOrders(data);
      setSession(getCashier(tenantSlug));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar pedidos';
      setError(message);
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [accessToken, tenantSlug]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    return () => {
      if (realtimeReloadRef.current) {
        window.clearTimeout(realtimeReloadRef.current);
      }
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const scheduleReload = React.useCallback(() => {
    if (realtimeReloadRef.current) return;
    realtimeReloadRef.current = window.setTimeout(() => {
      realtimeReloadRef.current = null;
      void load(false);
    }, 250);
  }, [load]);

  const showHint = React.useCallback((message: string) => {
    setUpdateHint(message);
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = window.setTimeout(() => {
      setUpdateHint(null);
    }, 5000);
  }, []);

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, () => {
    if (!realtimeEnabled) return;
    showHint('Novo pedido registrado. Atualizando resumo...');
    scheduleReload();
  });
  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, () => {
    if (!realtimeEnabled) return;
    scheduleReload();
  });

  const handleOpen = React.useCallback(
    (openingAmount: number) => {
      const next = openCashier(tenantSlug, { openingAmount });
      setSession(next);
    },
    [tenantSlug],
  );

  const handleClose = React.useCallback(
    (closingAmount: number) => {
      const next = closeCashier(tenantSlug, { closingAmount });
      setSession(next);
    },
    [tenantSlug],
  );

  const handleReset = React.useCallback(() => {
    resetCashier(tenantSlug);
    setSession(null);
  }, [tenantSlug]);

  return {
    session,
    orders,
    loading,
    error,
    updateHint,
    openCashier: handleOpen,
    closeCashier: handleClose,
    resetCashier: handleReset,
    reload: load,
  };
}
