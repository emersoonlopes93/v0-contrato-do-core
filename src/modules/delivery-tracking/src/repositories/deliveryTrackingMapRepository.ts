import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { DeliveryTrackingMapConfig } from '@/src/types/delivery-tracking';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

export async function fetchDeliveryTrackingMapConfig(
  accessToken: string,
): Promise<DeliveryTrackingMapConfig> {
  return requestJson<DeliveryTrackingMapConfig>(
    '/api/v1/tenant/delivery-tracking/map-config',
    accessToken,
  );
}
