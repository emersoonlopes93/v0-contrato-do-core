import type {
  ApiSuccessResponse,
  OrdersCreateOrderRequest,
  OrdersOrderDTO,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';

import { isRecord } from '@/src/core/utils/type-guards';
import { tenantApi } from '@/src/tenant/lib/tenantApi';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

async function requestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  const headers = { ...(init?.headers as Record<string, string> || {}) };
  const raw =
    method === 'POST'
      ? await tenantApi.post<ApiSuccessResponse<T>>(url, body, { tenantSlug, headers })
      : method === 'PUT'
      ? await tenantApi.put<ApiSuccessResponse<T>>(url, body, { tenantSlug, headers })
      : method === 'PATCH'
      ? await tenantApi.patch<ApiSuccessResponse<T>>(url, body, { tenantSlug, headers })
      : method === 'DELETE'
      ? await tenantApi.delete<ApiSuccessResponse<T>>(url, { tenantSlug, headers })
      : await tenantApi.get<ApiSuccessResponse<T>>(url, { tenantSlug, headers });
  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

export async function listOrders(tenantSlug: string): Promise<OrdersOrderSummaryDTO[]> {
  return requestJson<OrdersOrderSummaryDTO[]>('/api/v1/tenant/orders', tenantSlug);
}

export async function createOrder(
  tenantSlug: string,
  input: OrdersCreateOrderRequest,
): Promise<OrdersOrderDTO> {
  return requestJson<OrdersOrderDTO>('/api/v1/tenant/orders', tenantSlug, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
