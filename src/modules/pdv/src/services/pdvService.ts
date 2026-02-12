import { createOrder, listOrders } from '@/src/modules/pdv/src/repositories/ordersRepository';
import { listMenuCategories, listMenuProducts, getMenuSettings } from '@/src/modules/pdv/src/repositories/menuOnlineRepository';
import type { OrdersCreateOrderRequest, OrdersOrderDTO } from '@/src/types/orders';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import type { MenuOnlineCategoryDTO, MenuOnlineProductDTO, MenuOnlineSettingsDTO } from '@/src/types/menu-online';

export async function fetchPdvProducts(tenantSlug: string): Promise<MenuOnlineProductDTO[]> {
  return listMenuProducts(tenantSlug);
}

export async function fetchPdvCategories(tenantSlug: string): Promise<MenuOnlineCategoryDTO[]> {
  return listMenuCategories(tenantSlug);
}

export async function fetchPdvSettings(tenantSlug: string): Promise<MenuOnlineSettingsDTO> {
  return getMenuSettings(tenantSlug);
}

export async function submitPdvOrder(
  tenantSlug: string,
  input: OrdersCreateOrderRequest,
): Promise<OrdersOrderDTO> {
  return createOrder(tenantSlug, input);
}

export async function fetchPdvOrders(tenantSlug: string): Promise<OrdersOrderSummaryDTO[]> {
  return listOrders(tenantSlug);
}
