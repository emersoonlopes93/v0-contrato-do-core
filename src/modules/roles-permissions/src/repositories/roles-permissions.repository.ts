import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type {
  PermissionAssignmentRequest,
  RoleDTO,
  RolePermissionDTO,
  RoleCreateRequest,
  RoleUpdateRequest,
} from '@/src/types/roles-permissions';

export class RolesPermissionsRepository {
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

  async findByTenant(tenantId: string): Promise<RoleDTO[]> {
    return this.requestJson<RoleDTO[]>('/api/v1/tenant/roles-permissions/roles', tenantId);
  }

  async findRoleById(tenantId: string, id: string): Promise<RoleDTO | null> {
    const roles = await this.findByTenant(tenantId);
    return roles.find((role) => role.id === id) ?? null;
  }

  async create(tenantId: string, data: RoleCreateRequest): Promise<RoleDTO> {
    void tenantId;
    void data;
    throw new Error('Operação não suportada');
  }

  async update(tenantId: string, id: string, data: RoleUpdateRequest): Promise<RoleDTO | null> {
    void tenantId;
    void id;
    void data;
    throw new Error('Operação não suportada');
  }

  async delete(tenantId: string, id: string): Promise<void> {
    void tenantId;
    void id;
    throw new Error('Operação não suportada');
  }

  async assignPermission(tenantId: string, data: PermissionAssignmentRequest): Promise<RolePermissionDTO> {
    await this.requestJson<{ id: string }>(
      '/api/v1/tenant/roles-permissions/assign',
      tenantId,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

    const role = await this.findRoleById(tenantId, data.roleId);
    if (!role) {
      throw new Error('Role não encontrado');
    }

    const now = new Date().toISOString();
    return {
      id: `role-perm:${data.roleId}:${data.moduleId}:${data.permission}:${Date.now()}`,
      tenantId,
      role: role.name,
      moduleId: data.moduleId,
      permission: data.permission,
      createdAt: now,
      updatedAt: now,
    };
  }

  async removePermission(tenantId: string, roleId: string, moduleId: string): Promise<void> {
    await this.requestJson<null>('/api/v1/tenant/roles-permissions/remove', tenantId, {
      method: 'POST',
      body: JSON.stringify({ roleId, moduleId }),
    });
  }

  async getRolePermissions(tenantId: string, roleId: string): Promise<RolePermissionDTO[]> {
    const role = await this.findRoleById(tenantId, roleId);
    return role?.permissions ?? [];
  }

  async getEmployeePermissions(tenantId: string, employeeId: string): Promise<string[]> {
    void tenantId;
    void employeeId;
    throw new Error('Operação não suportada');
  }
}
