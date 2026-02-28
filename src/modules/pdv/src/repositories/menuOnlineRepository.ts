import type {
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
} from '@/src/types/menu-online';

import { isRecord } from '@/src/core/utils/type-guards';
import { tenantApi } from '@/src/tenant/lib/tenantApi';

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

async function requestJson<T>(url: string, tenantSlug: string): Promise<T> {
  const raw = await tenantApi.get<ApiSuccessResponse<T>>(url, { tenantSlug });
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
