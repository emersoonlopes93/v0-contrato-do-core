import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
} from '@/src/types/menu-online';

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

export async function listMenuProducts(accessToken: string): Promise<MenuOnlineProductDTO[]> {
  return requestJson<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', accessToken);
}

export async function listMenuCategories(accessToken: string): Promise<MenuOnlineCategoryDTO[]> {
  return requestJson<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', accessToken);
}

export async function getMenuSettings(accessToken: string): Promise<MenuOnlineSettingsDTO> {
  return requestJson<MenuOnlineSettingsDTO>('/api/v1/tenant/menu-online/settings', accessToken);
}
