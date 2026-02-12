import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  DeliveryPricingApplyRouteRequest,
  DeliveryPricingPreviewDTO,
  DeliveryPricingPreviewRequest,
  DeliveryPricingSettingsCreateRequest,
  DeliveryPricingSettingsDTO,
  DeliveryPricingSettingsUpdateRequest,
} from '@/src/types/delivery-pricing';

import { isRecord } from '@/src/core/utils/type-guards';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
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
  tenantSlug: string,
): Promise<DeliveryPricingSettingsDTO | null> {
  return requestJson<DeliveryPricingSettingsDTO | null>('/api/v1/tenant/delivery-pricing', tenantSlug);
}

export async function createDeliveryPricing(
  tenantSlug: string,
  input: DeliveryPricingSettingsCreateRequest,
): Promise<DeliveryPricingSettingsDTO> {
  return requestJson<DeliveryPricingSettingsDTO>('/api/v1/tenant/delivery-pricing', tenantSlug, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateDeliveryPricing(
  tenantSlug: string,
  input: DeliveryPricingSettingsUpdateRequest,
): Promise<DeliveryPricingSettingsDTO | null> {
  return requestJson<DeliveryPricingSettingsDTO | null>('/api/v1/tenant/delivery-pricing', tenantSlug, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function previewDeliveryPricing(
  tenantSlug: string,
  input: DeliveryPricingPreviewRequest,
): Promise<DeliveryPricingPreviewDTO> {
  return requestJson<DeliveryPricingPreviewDTO>('/api/v1/tenant/delivery-pricing/preview', tenantSlug, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function applyDeliveryPricingRoute(
  tenantSlug: string,
  input: DeliveryPricingApplyRouteRequest,
): Promise<void> {
  await requestJson<null>('/api/v1/tenant/delivery-pricing/apply-route', tenantSlug, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
