'use client';

import React, { useState } from 'react';
import { PermissionGuard, withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useEmployees } from '@/src/modules/employees/src/hooks';
import { isEmployeeRole, type EmployeeDTO, type EmployeeFormState, type EmployeeUpdateRequest, type EmployeeStatus } from '@/src/types/employees';
import { EMPLOYEES_PERMISSIONS } from '@/src/modules/employees/src/permissions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, Mail, UserCheck } from 'lucide-react';
import { registerSettingsSection } from '@/src/tenant/settings/settings-registry';

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
};

const STATUS_VARIANTS: Record<EmployeeStatus, { variant: NonNullable<BadgeProps['variant']>; className: string }> = {
  active: { variant: 'default', className: 'bg-emerald-500 text-white hover:bg-emerald-500/90' },
  inactive: { variant: 'outline', className: 'text-muted-foreground border-muted-foreground/40' },
};

const DEFAULT_ROLES = ['admin', 'gerente', 'cozinha', 'balconista', 'garcom'];

function EmployeesPageContent() {
  const { tenantSlug } = useTenant();
  const { hasPermission } = useSession();
  const canManage = hasPermission(EMPLOYEES_PERMISSIONS.MANAGE);
  const canView = hasPermission(EMPLOYEES_PERMISSIONS.VIEW);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDTO | null>(null);
  
  const [formData, setFormData] = useState<EmployeeFormState>({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
  } = useEmployees(tenantSlug);

  const handleCreate = async () => {
    try {
      if (!isEmployeeRole(formData.role)) {
        throw new Error('Role inválido');
      }
      await createEmployee({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: '' });
    } catch {
      // Error já é tratado no hook
    }
  };

  const handleEdit = (employee: EmployeeDTO) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    
    try {
      const payload: EmployeeUpdateRequest = {
        name: formData.name,
        email: formData.email,
      };
      if (isEmployeeRole(formData.role)) {
        payload.role = formData.role;
      }
      await updateEmployee(selectedEmployee.id, payload);
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      setFormData({ name: '', email: '', password: '', role: '' });
    } catch {
      // Error já é tratado no hook
    }
  };

  const handleDeactivate = async (employeeId: string) => {
    try {
      await deactivateEmployee(employeeId);
    } catch {
      // Error já é tratado no hook
    }
  };

  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para visualizar funcionários.
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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Funcionários</h1>
            <p className="text-muted-foreground">Gerencie os funcionários do seu estabelecimento</p>
          </div>
        </div>
        
        {canManage && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Funcionário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do funcionário"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha do funcionário"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      if (isEmployeeRole(value)) {
                        setFormData({ ...formData, role: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} className="flex-1" disabled={!formData.name || !formData.email || !formData.password || !formData.role}>
                    Criar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
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

      {/* Employees List */}
      {!loading && (
        <div className="space-y-4">
          {employees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece adicionando seu primeiro funcionário ao sistema.
                </p>
                {canManage && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Funcionário
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{employee.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{employee.email}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {employee.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={STATUS_VARIANTS[employee.status].variant}
                        className={STATUS_VARIANTS[employee.status].className}
                      >
                        {STATUS_LABELS[employee.status]}
                      </Badge>
                      
                      {canManage && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {employee.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desativar Funcionário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desativar o funcionário "{employee.name}"? 
                                    Ele não poderá mais acessar o sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeactivate(employee.id)}>
                                    Desativar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do funcionário"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (isEmployeeRole(value)) {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} className="flex-1" disabled={!formData.name || !formData.email || !formData.role}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeesPageWithPermission() {
  return (
    <PermissionGuard permission={EMPLOYEES_PERMISSIONS.VIEW}>
      <EmployeesPageContent />
    </PermissionGuard>
  );
}

export const EmployeesPage = withModuleGuard(EmployeesPageWithPermission, 'employees');

registerSettingsSection({
  id: 'employees',
  title: 'Usuários e Funcionários',
  description: 'Gestão de funcionários do tenant',
  icon: 'users',
  category: 'system',
  order: 3,
  component: EmployeesPage,
});
