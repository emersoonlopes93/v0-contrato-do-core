import { listOrders } from '@/src/modules/cashier/src/repositories/ordersRepository';
import {
  closeCashierSession,
  getCashierSession,
  openCashierSession,
  clearCashierSession,
} from '@/src/modules/cashier/src/repositories/cashierSessionRepository';
import type { CashierCloseRequest, CashierOpenRequest, CashierSession } from '@/src/types/cashier';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';

export async function fetchCashierOrders(tenantSlug: string): Promise<OrdersOrderSummaryDTO[]> {
  return listOrders(tenantSlug);
}

export function getCashier(tenantSlug: string): CashierSession | null {
  return getCashierSession(tenantSlug);
}

export function openCashier(tenantSlug: string, input: CashierOpenRequest): CashierSession {
  return openCashierSession(tenantSlug, input);
}

export function closeCashier(tenantSlug: string, input: CashierCloseRequest): CashierSession {
  return closeCashierSession(tenantSlug, input);
}

export function resetCashier(tenantSlug: string): void {
  clearCashierSession(tenantSlug);
}
