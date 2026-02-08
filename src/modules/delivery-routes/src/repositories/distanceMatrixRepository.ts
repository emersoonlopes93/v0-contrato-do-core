import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '@/src/types/api';
import type {
  DistanceMatrixCalculateRequest,
  DistanceMatrixResponse,
} from '@/src/types/delivery-routes';

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

export async function calculateDistanceMatrix(
  accessToken: string,
  input: DistanceMatrixCalculateRequest,
): Promise<DistanceMatrixResponse> {
  return requestJson<DistanceMatrixResponse>(
    '/api/v1/tenant/delivery-routes/distance-matrix',
    accessToken,
    { method: 'POST', body: JSON.stringify(input) },
  );
}
