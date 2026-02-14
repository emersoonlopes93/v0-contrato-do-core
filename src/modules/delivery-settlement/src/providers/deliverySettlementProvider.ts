import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  DeliverySettlementDTO,
  DeliverySettlementListRequest,
  DeliverySettlementListResponse,
  DeliverySettlementSettingsCreateRequest,
  DeliverySettlementSettingsDTO,
} from '@/src/types/delivery-settlement';
import { isRecord } from '@/src/core/utils/type-guards';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
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

class DeliverySettlementApiProvider {
  async getSettings(tenantId: string): Promise<DeliverySettlementSettingsDTO | null> {
    void tenantId;
    return requestJson<DeliverySettlementSettingsDTO | null>(
      '/api/v1/tenant/delivery-settlement/settings',
    );
  }

  async upsertSettings(
    tenantId: string,
    input: DeliverySettlementSettingsCreateRequest,
  ): Promise<DeliverySettlementSettingsDTO> {
    void tenantId;
    return requestJson<DeliverySettlementSettingsDTO>(
      '/api/v1/tenant/delivery-settlement/settings',
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    );
  }

  async getSettlementByOrderId(
    tenantId: string,
    orderId: string,
  ): Promise<DeliverySettlementDTO | null> {
    void tenantId;
    return requestJson<DeliverySettlementDTO | null>(
      `/api/v1/tenant/delivery-settlement/${orderId}`,
    );
  }

  async listSettlements(request: DeliverySettlementListRequest): Promise<DeliverySettlementListResponse> {
    const searchParams = new URLSearchParams();
    if (request.page) searchParams.set('page', String(request.page));
    if (request.limit) searchParams.set('limit', String(request.limit));
    if (request.startDate) searchParams.set('startDate', request.startDate);
    if (request.endDate) searchParams.set('endDate', request.endDate);
    if (request.orderId) searchParams.set('orderId', request.orderId);
    return requestJson<DeliverySettlementListResponse>(
      `/api/v1/tenant/delivery-settlement?${searchParams.toString()}`,
    );
  }
}

export const deliverySettlementProvider = new DeliverySettlementApiProvider();
