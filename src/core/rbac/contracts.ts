import type { TenantId, UserId, ModuleId } from "../types/index";

export interface Permission {
  id: string;
  moduleId: ModuleId;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  tenantId: TenantId;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: UserId;
  tenantId: TenantId;
  roleId: string;
}

export interface RBACService {
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;

  assignRoleToUser(userId: UserId, tenantId: TenantId, roleId: string): Promise<void>;
  removeRoleFromUser(userId: UserId, tenantId: TenantId, roleId: string): Promise<void>;

  getUserPermissions(userId: UserId, tenantId: TenantId): Promise<string[]>;
  getUserRoles(userId: UserId, tenantId: TenantId): Promise<Role[]>;

  checkPermission(userId: UserId, tenantId: TenantId, permissionId: string): Promise<boolean>;
  checkPermissions(
    userId: UserId,
    tenantId: TenantId,
    permissionIds: string[]
  ): Promise<boolean>;

  listTenantPermissions(tenantId: TenantId): Promise<Permission[]>;
  listTenantRoles(tenantId: TenantId): Promise<Role[]>;
}
