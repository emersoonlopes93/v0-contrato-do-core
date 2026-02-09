import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  DeliveryPricingApplyRouteRequest,
  DeliveryPricingPreviewDTO,
  DeliveryPricingPreviewRequest,
  DeliveryPricingSettingsCreateRequest,
  DeliveryPricingSettingsDTO,
  DeliveryPricingSettingsUpdateRequest,
} from '@/src/types/delivery-pricing';

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

export async function fetchDeliveryPricing(
  accessToken: string,
): Promise<DeliveryPricingSettingsDTO | null> {
  return requestJson<DeliveryPricingSettingsDTO | null>('/api/v1/tenant/delivery-pricing', accessToken);
}

export async function createDeliveryPricing(
  accessToken: string,
  input: DeliveryPricingSettingsCreateRequest,
): Promise<DeliveryPricingSettingsDTO> {
  return requestJson<DeliveryPricingSettingsDTO>('/api/v1/tenant/delivery-pricing', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateDeliveryPricing(
  accessToken: string,
  input: DeliveryPricingSettingsUpdateRequest,
): Promise<DeliveryPricingSettingsDTO | null> {
  return requestJson<DeliveryPricingSettingsDTO | null>('/api/v1/tenant/delivery-pricing', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function previewDeliveryPricing(
  accessToken: string,
  input: DeliveryPricingPreviewRequest,
): Promise<DeliveryPricingPreviewDTO> {
  return requestJson<DeliveryPricingPreviewDTO>('/api/v1/tenant/delivery-pricing/preview', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function applyDeliveryPricingRoute(
  accessToken: string,
  input: DeliveryPricingApplyRouteRequest,
): Promise<void> {
  await requestJson<null>('/api/v1/tenant/delivery-pricing/apply-route', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
