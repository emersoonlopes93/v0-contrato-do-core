export type Role = 'admin' | 'gerente' | 'cozinha' | 'balconista' | 'garcom';

export function isRole(role: string): role is Role {
  return role === 'admin' || role === 'gerente' || role === 'cozinha' || role === 'balconista' || role === 'garcom';
}

export type Permission = 'view' | 'manage' | 'operate';

export type RolePermissionDTO = {
  id: string;
  tenantId: string;
  role: Role;
  moduleId: string;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
};

export type RoleDTO = {
  id: string;
  tenantId: string;
  name: Role;
  description: string;
  permissions: RolePermissionDTO[];
  createdAt: string;
  updatedAt: string;
};

export type RoleCreateRequest = {
  name: Role;
  description: string;
};

export type RoleUpdateRequest = {
  name?: Role;
  description?: string;
};

export type PermissionAssignmentRequest = {
  roleId: string;
  moduleId: string;
  permission: Permission;
};

export type RolesPermissionsServiceContract = {
  listRoles(tenantId: string): Promise<RoleDTO[]>;
  findRoleById(tenantId: string, id: string): Promise<RoleDTO | null>;
  createRole(tenantId: string, data: RoleCreateRequest): Promise<RoleDTO>;
  updateRole(tenantId: string, id: string, data: RoleUpdateRequest): Promise<RoleDTO>;
  deleteRole(tenantId: string, id: string): Promise<void>;
  assignPermission(tenantId: string, data: PermissionAssignmentRequest): Promise<RolePermissionDTO>;
  removePermission(tenantId: string, roleId: string, moduleId: string): Promise<void>;
  getRolePermissions(tenantId: string, roleId: string): Promise<RolePermissionDTO[]>;
  checkPermission(tenantId: string, employeeId: string, moduleId: string, permission: Permission): Promise<boolean>;
};
