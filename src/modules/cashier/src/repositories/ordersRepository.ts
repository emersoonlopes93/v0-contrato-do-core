import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';

import { isRecord } from '@/src/core/utils/type-guards';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, tenantSlug: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
      'Content-Type': 'application/json',
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

export async function listOrders(tenantSlug: string): Promise<OrdersOrderSummaryDTO[]> {
  return requestJson<OrdersOrderSummaryDTO[]>('/api/v1/tenant/orders', tenantSlug);
}
