 import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
 import type { EmployeeCreateRequest, EmployeeDTO, EmployeeUpdateRequest } from '@/src/types/employees';

export class EmployeesRepository {
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
    return this.isRecord(value) && value.success === true && 'data' in value;
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return this.isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
  }

  private async requestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
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
      if (this.isApiErrorResponse(raw)) throw new Error(raw.message);
      throw new Error('Falha na requisição');
    }

    if (!this.isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
    return raw.data;
  }

  async findByTenant(tenantId: string): Promise<EmployeeDTO[]> {
    return this.requestJson<EmployeeDTO[]>('/api/v1/tenant/employees', tenantId);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDTO | null> {
    const all = await this.findByTenant(tenantId);
    return all.find((e) => e.id === id) ?? null;
  }

  async create(tenantId: string, data: EmployeeCreateRequest): Promise<EmployeeDTO> {
    return this.requestJson<EmployeeDTO>('/api/v1/tenant/employees', tenantId, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(tenantId: string, id: string, data: EmployeeUpdateRequest): Promise<EmployeeDTO | null> {
    return this.requestJson<EmployeeDTO>(`/api/v1/tenant/employees/${id}`, tenantId, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivate(tenantId: string, id: string): Promise<void> {
    await this.requestJson<null>(`/api/v1/tenant/employees/${id}/deactivate`, tenantId, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}
