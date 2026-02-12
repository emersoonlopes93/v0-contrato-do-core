import type { 
  RoleDTO, 
  RolePermissionDTO, 
  RoleCreateRequest, 
  RoleUpdateRequest, 
  PermissionAssignmentRequest,
  RolesPermissionsServiceContract,
  Permission
} from '@/src/types/roles-permissions';
import { RolesPermissionsRepository } from '@/src/modules/roles-permissions/src/repositories';

export class RolesPermissionsService implements RolesPermissionsServiceContract {
  private repository = new RolesPermissionsRepository();

  async listRoles(tenantId: string): Promise<RoleDTO[]> {
    return await this.repository.findByTenant(tenantId);
  }

  async findRoleById(tenantId: string, id: string): Promise<RoleDTO | null> {
    return await this.repository.findRoleById(tenantId, id);
  }

  async createRole(tenantId: string, data: RoleCreateRequest): Promise<RoleDTO> {
    void tenantId;
    void data;
    throw new Error('Operação não suportada');
  }

  async updateRole(tenantId: string, id: string, data: RoleUpdateRequest): Promise<RoleDTO> {
    void tenantId;
    void id;
    void data;
    throw new Error('Operação não suportada');
  }

  async deleteRole(tenantId: string, id: string): Promise<void> {
    void tenantId;
    void id;
    throw new Error('Operação não suportada');
  }

  async assignPermission(tenantId: string, data: PermissionAssignmentRequest): Promise<RolePermissionDTO> {
    const role = await this.repository.findRoleById(tenantId, data.roleId);
    if (!role) {
      throw new Error('Role não encontrado');
    }

    // Validar se a permissão já existe
    const existingPermissions = await this.repository.getRolePermissions(tenantId, data.roleId);
    const permissionExists = existingPermissions.some(
      p => p.moduleId === data.moduleId && p.role === role.name
    );

    if (permissionExists) {
      throw new Error('Permissão já existe para este role');
    }

    return await this.repository.assignPermission(tenantId, data);
  }

  async removePermission(tenantId: string, roleId: string, moduleId: string): Promise<void> {
    const role = await this.repository.findRoleById(tenantId, roleId);
    if (!role) {
      throw new Error('Role não encontrado');
    }

    await this.repository.removePermission(tenantId, roleId, moduleId);
  }

  async getRolePermissions(tenantId: string, roleId: string): Promise<RolePermissionDTO[]> {
    const role = await this.repository.findRoleById(tenantId, roleId);
    if (!role) {
      throw new Error('Role não encontrado');
    }

    return await this.repository.getRolePermissions(tenantId, roleId);
  }

  async checkPermission(tenantId: string, employeeId: string, moduleId: string, permission: Permission): Promise<boolean> {
    // TODO: Implementar lógica real de verificação de permissão
    // Por enquanto, vamos usar uma lógica simplificada
    
    const employeePermissions = await this.repository.getEmployeePermissions(tenantId, employeeId);
    const hasPermission = employeePermissions.some(empPermission => 
      empPermission.includes(`${moduleId}.${permission}`)
    );

    return hasPermission;
  }

  // Métodos auxiliares para configuração inicial
  async setupDefaultPermissions(tenantId: string): Promise<void> {
    const roles = await this.listRoles(tenantId);
    const modules = await this.getAvailableModules();

    for (const role of roles) {
      const permissions = this.getDefaultPermissionsForRole(role.name, modules);
      
      for (const permission of permissions) {
        try {
          await this.assignPermission(tenantId, {
            roleId: role.id,
            moduleId: permission.moduleId,
            permission: permission.permission,
          });
        } catch {
          // Ignorar erros de permissão já existente
          console.warn(`Permissão já existe: ${role.name} - ${permission.moduleId}.${permission.permission}`);
        }
      }
    }
  }

  private async getAvailableModules(): Promise<string[]> {
    // TODO: Obter módulos disponíveis do registry
    return [
      'employees',
      'roles-permissions',
      'orders-module',
      'menu-online',
      'payments',
      'financial',
      'delivery-drivers',
      'delivery-routes',
      'delivery-tracking',
      'kds',
      'pdv',
      'cashier',
    ];
  }

  private getDefaultPermissionsForRole(role: string, modules: string[]): Array<{moduleId: string, permission: Permission}> {
    const permissions: Array<{moduleId: string, permission: Permission}> = [];

    switch (role) {
      case 'admin':
        // Admin tem todas as permissões
        modules.forEach(module => {
          permissions.push(
            { moduleId: module, permission: 'view' },
            { moduleId: module, permission: 'manage' },
            { moduleId: module, permission: 'operate' }
          );
        });
        break;

      case 'gerente':
        // Gerente tem permissão de view e manage na maioria dos módulos
        modules.forEach(module => {
          permissions.push(
            { moduleId: module, permission: 'view' },
            { moduleId: module, permission: 'manage' }
          );
        });
        break;

      case 'cozinha': {
        // Cozinha tem acesso limitado
        const kitchenModules = ['kds', 'orders-module', 'menu-online'];
        kitchenModules.forEach(module => {
          permissions.push(
            { moduleId: module, permission: 'view' },
            { moduleId: module, permission: 'operate' }
          );
        });
        break;
      }

      case 'balconista': {
        // Balconista atende clientes
        const cashierModules = ['pdv', 'cashier', 'orders-module', 'menu-online'];
        cashierModules.forEach(module => {
          permissions.push(
            { moduleId: module, permission: 'view' },
            { moduleId: module, permission: 'operate' }
          );
        });
        break;
      }

      case 'garcom': {
        // Garçom atende mesas
        const waiterModules = ['orders-module', 'menu-online'];
        waiterModules.forEach(module => {
          permissions.push(
            { moduleId: module, permission: 'view' },
            { moduleId: module, permission: 'operate' }
          );
        });
        break;
      }
    }

    return permissions;
  }
}
