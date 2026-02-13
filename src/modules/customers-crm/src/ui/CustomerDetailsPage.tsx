'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PermissionGuard, withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useCustomersCrm } from '@/src/modules/customers-crm/src/hooks';
import { type CustomersCrmUpdateCustomerRequest, type CustomersCrmCustomerStatus, type CustomersCrmCustomerOrderSummaryDTO } from '@/src/types/customers-crm';
import { CUSTOMERS_CRM_PERMISSIONS } from '@/src/modules/customers-crm/src/permissions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Phone, Mail, Calendar, DollarSign, TrendingUp, UserCheck, Edit2, Save } from 'lucide-react';

const STATUS_LABELS: Record<CustomersCrmCustomerStatus, string> = {
  normal: 'Normal',
  vip: 'VIP',
  bloqueado: 'Bloqueado',
  inativo: 'Inativo',
};

const STATUS_VARIANTS: Record<CustomersCrmCustomerStatus, { variant: NonNullable<BadgeProps['variant']>; className: string }> = {
  normal: { variant: 'default', className: 'bg-blue-500 text-white hover:bg-blue-500/90' },
  vip: { variant: 'default', className: 'bg-purple-500 text-white hover:bg-purple-500/90' },
  bloqueado: { variant: 'destructive', className: 'bg-red-500 text-white hover:bg-red-500/90' },
  inativo: { variant: 'outline', className: 'text-muted-foreground border-muted-foreground/40' },
};

function CustomerDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { tenantSlug } = useTenant();
  const { hasPermission } = useSession();
  const canManage = hasPermission(CUSTOMERS_CRM_PERMISSIONS.MANAGE);
  const canView = hasPermission(CUSTOMERS_CRM_PERMISSIONS.VIEW);
  
  const customerId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CustomersCrmUpdateCustomerRequest>({
    name: '',
    email: null,
    notes: null,
    status: 'normal',
  });

  const {
    customer,
    loading,
    error,
    updateCustomer,
    loadCustomer,
  } = useCustomersCrm(tenantSlug);

  useEffect(() => {
    if (customerId) {
      loadCustomer(customerId);
    }
  }, [customerId, loadCustomer]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.customer.name,
        email: customer.customer.email,
        notes: customer.customer.notes,
        status: customer.customer.status,
      });
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;
    
    try {
      await updateCustomer(customer.customer.id, formData);
      setIsEditing(false);
      await loadCustomer(customerId);
    } catch {
      // Error já é tratado no hook
    }
  };

  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.customer.name,
        email: customer.customer.email,
        notes: customer.customer.notes,
        status: customer.customer.status,
      });
    }
    setIsEditing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para visualizar detalhes de clientes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Cliente não encontrado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
          <p className="text-muted-foreground">Informações completas e histórico</p>
        </div>
        {canManage && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                      placeholder="cliente@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: CustomersCrmCustomerStatus) => 
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                      placeholder="Observações sobre o cliente..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={!formData.name}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <p className="font-medium text-lg">{customer.customer.name}</p>
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{customer.customer.phone}</p>
                      </div>
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{customer.customer.email || 'Não informado'}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge 
                        variant={STATUS_VARIANTS[customer.customer.status].variant}
                        className={STATUS_VARIANTS[customer.customer.status].className}
                      >
                        {STATUS_LABELS[customer.customer.status]}
                      </Badge>
                    </div>
                  </div>
                  {customer.customer.notes && (
                    <div>
                      <Label>Observações</Label>
                      <p className="text-sm bg-muted p-3 rounded-md">{customer.customer.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order History Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{customer.customer.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">Total de Pedidos</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(customer.customer.totalSpent)}</div>
                  <div className="text-sm text-muted-foreground">Total Gasto</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(customer.customer.averageTicket)}</div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{customer.customer.frequencyScore}</div>
                  <div className="text-sm text-muted-foreground">Score Frequência</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente desde</p>
                  <p className="font-medium">{formatDate(customer.customer.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Último pedido</p>
                  <p className="font-medium">{customer.customer.lastOrderAt ? formatDate(customer.customer.lastOrderAt) : 'Nunca'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Preview */}
          {customer.recentOrders && customer.recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.recentOrders.slice(0, 5).map((order: CustomersCrmCustomerOrderSummaryDTO) => (
                    <div key={order.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsPageWithPermission() {
  return (
    <PermissionGuard permission={CUSTOMERS_CRM_PERMISSIONS.VIEW}>
      <CustomerDetailsPageContent />
    </PermissionGuard>
  );
}

export const CustomerDetailsPage = withModuleGuard(CustomerDetailsPageWithPermission, 'customers-crm');
