'use client';

import React, { useState } from 'react';
import { withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useRolesPermissions } from '@/src/modules/roles-permissions/src/hooks';
import { type RoleDTO, type Permission } from '@/src/types/roles-permissions';
import { ROLES_PERMISSIONS_PERMISSIONS } from '@/src/modules/roles-permissions/src/permissions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Users, Key } from 'lucide-react';
import { registerSettingsSection } from '@/src/tenant/settings/settings-registry';

const PERMISSION_LABELS: Record<Permission, string> = {
  view: 'Visualizar',
  manage: 'Gerenciar',
  operate: 'Operar',
};

const AVAILABLE_MODULES = [
  { id: 'employees', name: 'Funcionários' },
  { id: 'roles-permissions', name: 'Perfis e Permissões' },
  { id: 'customers-crm', name: 'CRM de Clientes' },
  { id: 'orders-module', name: 'Pedidos' },
  { id: 'menu-online', name: 'Cardápio Digital' },
  { id: 'payments', name: 'Pagamentos' },
  { id: 'financial', name: 'Financeiro' },
  { id: 'delivery-drivers', name: 'Entregadores' },
  { id: 'delivery-routes', name: 'Rotas de Entrega' },
  { id: 'delivery-tracking', name: 'Rastreamento' },
  { id: 'kds', name: 'KDS' },
  { id: 'pdv', name: 'PDV' },
  { id: 'cashier', name: 'Caixa' },
];

function RolesPermissionsPageContent() {
  const { tenantSlug } = useTenant();
  const { hasPermission } = useSession();
  const canManage = hasPermission(ROLES_PERMISSIONS_PERMISSIONS.MANAGE);
  const canView = hasPermission(ROLES_PERMISSIONS_PERMISSIONS.VIEW);
  const canOperate = hasPermission(ROLES_PERMISSIONS_PERMISSIONS.OPERATE);

  // Administradores com MANAGE ou OPERATE têm acesso total
  const hasFullAccess = canManage || canOperate;

  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);

  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Permission[]>>({});

  const {
    roles,
    rolePermissions,
    loading,
    error,
    assignPermission,
    removePermission,
    loadRolePermissions,
  } = useRolesPermissions(tenantSlug);

  const openPermissionsDialog = async (role: RoleDTO) => {
    setSelectedRole(role);
    await loadRolePermissions(role.id);
    
    // Inicializar selectedPermissions baseado nas permissões existentes
    const permissions: Record<string, Permission[]> = {};
    AVAILABLE_MODULES.forEach(module => {
      permissions[module.id] = rolePermissions
        .filter(p => p.moduleId === module.id)
        .map(p => p.permission);
    });
    
    setSelectedPermissions(permissions);
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (moduleId: string, permission: Permission, checked: boolean) => {
    setSelectedPermissions(prev => {
      const current = prev[moduleId] || [];
      if (checked) {
        return {
          ...prev,
          [moduleId]: [...current.filter(p => p !== permission), permission],
        };
      } else {
        return {
          ...prev,
          [moduleId]: current.filter(p => p !== permission),
        };
      }
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    try {
      // Primeiro, remover todas as permissões existentes
      for (const permission of rolePermissions) {
        await removePermission(selectedRole.id, permission.moduleId);
      }

      // Depois, adicionar as novas permissões
      for (const [moduleId, permissions] of Object.entries(selectedPermissions)) {
        for (const permission of permissions) {
          await assignPermission({
            roleId: selectedRole.id,
            moduleId,
            permission,
          });
        }
      }

      // Fechar modal e limpar estado
      setIsPermissionsDialogOpen(false);
      setSelectedRole(null);
      setSelectedPermissions({});
      
      // Recarregar as permissões do role
      await loadRolePermissions(selectedRole.id);
    } catch {
      // Error já é tratado no hook
    }
  };

  if (!canView && !hasFullAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para visualizar perfis e permissões.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Perfis e Permissões</h1>
            <p className="text-muted-foreground">Gerencie os perfis de acesso e permissões do sistema</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Roles List */}
      {!loading && (
        <div className="space-y-4">
          {roles.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum perfil encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando os perfis de acesso para seu sistema.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate capitalize">{role.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {role.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {role.permissions.length} permissões
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Key className="h-3 w-3" />
                        <span>{role.permissions.length} módulos</span>
                      </div>
                      
                      {hasFullAccess && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionsDialog(role)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Permissões
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciar Permissões - {selectedRole?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Selecione as permissões que este perfil terá acesso em cada módulo do sistema.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {AVAILABLE_MODULES.map((module) => (
              <Card key={module.id} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {module.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                      <div key={permission} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`${module.id}-${permission}`}
                          checked={selectedPermissions[module.id]?.includes(permission as Permission) || false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.id, permission as Permission, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`${module.id}-${permission}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-3 pt-6 border-t bg-background sticky bottom-0">
              <Button 
                variant="outline" 
                onClick={() => setIsPermissionsDialogOpen(false)} 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={savePermissions} 
                className="flex-1"
                disabled={!selectedRole}
              >
                <Shield className="h-4 w-4 mr-2" />
                Salvar Permissões
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const RolesPermissionsPage = withModuleGuard(RolesPermissionsPageContent, 'roles-permissions');

registerSettingsSection({
  id: 'roles-permissions',
  title: 'Perfis e Permissões',
  description: 'Perfis de acesso e permissões por módulo',
  icon: 'shield',
  category: 'system',
  order: 4,
  component: RolesPermissionsPage,
});
