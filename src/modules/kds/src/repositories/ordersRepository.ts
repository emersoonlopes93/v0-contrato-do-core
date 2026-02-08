import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  OrdersCreateOrderRequest,
  OrdersOrderDTO,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
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

export async function listOrders(accessToken: string): Promise<OrdersOrderSummaryDTO[]> {
  return requestJson<OrdersOrderSummaryDTO[]>('/api/v1/tenant/orders', accessToken);
}

export async function getOrder(accessToken: string, orderId: string): Promise<OrdersOrderDTO> {
  return requestJson<OrdersOrderDTO>(`/api/v1/tenant/orders/${orderId}`, accessToken);
}

export async function updateOrderStatus(
  accessToken: string,
  orderId: string,
  status: string,
): Promise<OrdersOrderDTO> {
  return requestJson<OrdersOrderDTO>(`/api/v1/tenant/orders/${orderId}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function createOrder(
  accessToken: string,
  input: OrdersCreateOrderRequest,
): Promise<OrdersOrderDTO> {
  return requestJson<OrdersOrderDTO>('/api/v1/tenant/orders', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
