import { listOrders, updateOrderStatus } from '@/src/modules/kds/src/repositories/ordersRepository';
import type { OrdersOrderDTO, OrdersOrderSummaryDTO } from '@/src/types/orders';

export async function fetchKdsOrders(tenantSlug: string): Promise<OrdersOrderSummaryDTO[]> {
  return listOrders(tenantSlug);
}

export async function changeKdsOrderStatus(
  tenantSlug: string,
  orderId: string,
  status: string,
): Promise<OrdersOrderDTO> {
  return updateOrderStatus(tenantSlug, orderId, status);
}
