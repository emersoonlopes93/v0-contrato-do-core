import { createOrder, listOrders } from '@/src/modules/pdv/src/repositories/ordersRepository';
import { listMenuCategories, listMenuProducts, getMenuSettings } from '@/src/modules/pdv/src/repositories/menuOnlineRepository';
import type { OrdersCreateOrderRequest, OrdersOrderDTO } from '@/src/types/orders';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import type { MenuOnlineCategoryDTO, MenuOnlineProductDTO, MenuOnlineSettingsDTO } from '@/src/types/menu-online';

export async function fetchPdvProducts(accessToken: string): Promise<MenuOnlineProductDTO[]> {
  return listMenuProducts(accessToken);
}

export async function fetchPdvCategories(accessToken: string): Promise<MenuOnlineCategoryDTO[]> {
  return listMenuCategories(accessToken);
}

export async function fetchPdvSettings(accessToken: string): Promise<MenuOnlineSettingsDTO> {
  return getMenuSettings(accessToken);
}

export async function submitPdvOrder(
  accessToken: string,
  input: OrdersCreateOrderRequest,
): Promise<OrdersOrderDTO> {
  return createOrder(accessToken, input);
}

export async function fetchPdvOrders(accessToken: string): Promise<OrdersOrderSummaryDTO[]> {
  return listOrders(accessToken);
}
