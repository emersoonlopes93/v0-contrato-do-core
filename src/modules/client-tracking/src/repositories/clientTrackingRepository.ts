import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { ClientTrackingSnapshot } from '@/src/types/client-tracking';

import { isRecord } from '@/src/core/utils/type-guards';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }
  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

export async function fetchClientTrackingSnapshot(
  token: string,
): Promise<ClientTrackingSnapshot> {
  return requestJson<ClientTrackingSnapshot>(
    `/api/v1/public/track/${encodeURIComponent(token)}`,
  );
}
