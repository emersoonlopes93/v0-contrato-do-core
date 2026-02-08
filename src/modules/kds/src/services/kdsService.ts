import { listOrders, updateOrderStatus } from '@/src/modules/kds/src/repositories/ordersRepository';
import type { OrdersOrderDTO, OrdersOrderSummaryDTO } from '@/src/types/orders';

export async function fetchKdsOrders(accessToken: string): Promise<OrdersOrderSummaryDTO[]> {
  return listOrders(accessToken);
}

export async function changeKdsOrderStatus(
  accessToken: string,
  orderId: string,
  status: string,
): Promise<OrdersOrderDTO> {
  return updateOrderStatus(accessToken, orderId, status);
}
