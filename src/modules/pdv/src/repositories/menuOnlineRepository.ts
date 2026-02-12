import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
} from '@/src/types/menu-online';

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

export async function listMenuProducts(tenantSlug: string): Promise<MenuOnlineProductDTO[]> {
  return requestJson<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', tenantSlug);
}

export async function listMenuCategories(tenantSlug: string): Promise<MenuOnlineCategoryDTO[]> {
  return requestJson<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', tenantSlug);
}

export async function getMenuSettings(tenantSlug: string): Promise<MenuOnlineSettingsDTO> {
  return requestJson<MenuOnlineSettingsDTO>('/api/v1/tenant/menu-online/settings', tenantSlug);
}
