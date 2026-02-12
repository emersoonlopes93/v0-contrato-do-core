import { useState, useEffect, useCallback } from 'react';
import type { 
  RoleDTO, 
  RolePermissionDTO, 
  PermissionAssignmentRequest 
} from '@/src/types/roles-permissions';
import { RolesPermissionsService } from '@/src/modules/roles-permissions/src/services';

const service = new RolesPermissionsService();

type State = {
  roles: RoleDTO[];
  role: RoleDTO | null;
  rolePermissions: RolePermissionDTO[];
  loading: boolean;
  error: string | null;
  assignPermission: (data: PermissionAssignmentRequest) => Promise<void>;
  removePermission: (roleId: string, moduleId: string) => Promise<void>;
  loadRolePermissions: (roleId: string) => Promise<void>;
  reload: () => Promise<void>;
};

export function useRolesPermissions(tenantId: string): State {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.listRoles(tenantId);
      setRoles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const loadRolePermissions = useCallback(async (roleId: string) => {
    if (!tenantId || !roleId) return;
    
    try {
      const result = await service.getRolePermissions(tenantId, roleId);
      setRolePermissions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar permissões do perfil');
    }
  }, [tenantId]);

  const assignPermission = useCallback(async (data: PermissionAssignmentRequest) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await service.assignPermission(tenantId, data);
      await loadRoles();
      // Recarregar permissões do role se estiverem sendo exibidas
      if (rolePermissions.length > 0 && rolePermissions[0].role) {
        const currentRole = roles.find(r => r.id === data.roleId);
        if (currentRole) {
          await loadRolePermissions(data.roleId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir permissão');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadRoles, loadRolePermissions, rolePermissions, roles]);

  const removePermission = useCallback(async (roleId: string, moduleId: string) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await service.removePermission(tenantId, roleId, moduleId);
      await loadRoles();
      await loadRolePermissions(roleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover permissão');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadRolePermissions, loadRoles]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    role: null,
    rolePermissions,
    loading,
    error,
    assignPermission,
    removePermission,
    loadRolePermissions,
    reload: loadRoles,
  };
}

export function useRole(tenantId: string, id: string) {
  const [role, setRole] = useState<RoleDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRole = useCallback(async () => {
    if (!tenantId || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.findRoleById(tenantId, id);
      setRole(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [tenantId, id]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  return {
    role,
    loading,
    error,
    reload: loadRole,
  };
}
