'use client';

import React, { useState } from 'react';
import { PermissionGuard, withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useCustomersCrm } from '@/src/modules/customers-crm/src/hooks';
import { type CustomersCrmCustomerListItemDTO, type CustomersCrmCustomerStatus } from '@/src/types/customers-crm';
import { CUSTOMERS_CRM_PERMISSIONS } from '@/src/modules/customers-crm/src/permissions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Phone, 
  Mail, 
  Search, 
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
  Star,
  UserCheck
} from 'lucide-react';

const STATUS_LABELS: Record<CustomersCrmCustomerStatus, string> = {
  normal: 'Normal',
  vip: 'VIP',
  bloqueado: 'Bloqueado',
  inativo: 'Inativo',
};

const BADGE_LABELS: Record<string, string> = {
  normal: 'Normal',
  vip: 'VIP',
  recorrente: 'Recorrente',
  novo: 'Novo',
};

const STATUS_VARIANTS: Record<CustomersCrmCustomerStatus, { variant: NonNullable<BadgeProps['variant']>; className: string }> = {
  normal: { variant: 'default', className: 'bg-blue-500 text-white hover:bg-blue-500/90' },
  vip: { variant: 'default', className: 'bg-purple-500 text-white hover:bg-purple-500/90' },
  bloqueado: { variant: 'destructive', className: 'bg-red-500 text-white hover:bg-red-500/90' },
  inativo: { variant: 'outline', className: 'text-muted-foreground border-muted-foreground/40' },
};

const BADGE_VARIANTS: Record<string, { variant: NonNullable<BadgeProps['variant']>; className: string }> = {
  normal: { variant: 'outline', className: 'border-blue-500 text-blue-600' },
  vip: { variant: 'default', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  recorrente: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
  novo: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

const SEGMENT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'vip', label: 'VIP' },
  { value: 'recorrente', label: 'Recorrentes' },
  { value: 'novo', label: 'Novos' },
  { value: 'top10', label: 'Top 10' },
  { value: 'avgAboveOverall', label: 'Acima da Média' },
  { value: 'last30d', label: 'Últimos 30 dias' },
  { value: 'inactive60d', label: 'Inativos 60 dias' },
];

function CustomersCRMPageContent() {
  const { tenantSlug } = useTenant();
  const { hasPermission } = useSession();
  const canManage = hasPermission(CUSTOMERS_CRM_PERMISSIONS.MANAGE);
  const canView = hasPermission(CUSTOMERS_CRM_PERMISSIONS.VIEW);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomersCrmCustomerListItemDTO | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const {
    customers,
    loading,
    error,
    pagination,
    loadCustomers,
  } = useCustomersCrm(tenantSlug);

  const handleSearch = () => {
    loadCustomers(1, { search: searchTerm, segment: selectedSegment });
  };

  const handleSegmentChange = (value: string) => {
    setSelectedSegment(value);
    loadCustomers(1, { search: searchTerm, segment: value });
  };

  const handlePageChange = (page: number) => {
    loadCustomers(page, { search: searchTerm, segment: selectedSegment });
  };

  const handleCustomerClick = (customer: CustomersCrmCustomerListItemDTO) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para visualizar o CRM de clientes.
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
            <h1 className="text-2xl font-bold">CRM de Clientes</h1>
            <p className="text-muted-foreground">Gerencie inteligentemente seus clientes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="segment">Segmento</Label>
              <Select value={selectedSegment} onValueChange={handleSegmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um segmento" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Customers List */}
      {!loading && (
        <div className="space-y-4">
          {customers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground text-center">
                  Tente ajustar os filtros ou aguarde novos pedidos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{pagination.totalItems}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">VIPs</p>
                        <p className="text-2xl font-bold">
                          {customers.filter(c => c.badge === 'vip').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Recorrentes</p>
                        <p className="text-2xl font-bold">
                          {customers.filter(c => c.badge === 'recorrente').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-2xl font-bold">
                          {customers.length > 0 
                            ? formatCurrency(customers.reduce((acc, c) => acc + c.averageTicket, 0) / customers.length)
                            : 'R$0,00'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customers Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customers.map((customer) => (
                  <Card 
                    key={customer.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{customer.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground truncate">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={BADGE_VARIANTS[customer.badge].variant}
                            className={BADGE_VARIANTS[customer.badge].className}
                          >
                            {BADGE_LABELS[customer.badge]}
                          </Badge>
                          <Badge 
                            variant={STATUS_VARIANTS[customer.status].variant}
                            className={STATUS_VARIANTS[customer.status].className}
                          >
                            {STATUS_LABELS[customer.status]}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pedidos:</span>
                          <span className="font-medium">{customer.totalOrders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total gasto:</span>
                          <span className="font-medium">{formatCurrency(customer.totalSpent)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ticket médio:</span>
                          <span className="font-medium">{formatCurrency(customer.averageTicket)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Último pedido:</span>
                          <span className="font-medium">{formatDate(customer.lastOrderAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="flex items-center px-4 py-2 text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge 
                    variant={STATUS_VARIANTS[selectedCustomer.status].variant}
                    className={STATUS_VARIANTS[selectedCustomer.status].className}
                  >
                    {STATUS_LABELS[selectedCustomer.status]}
                  </Badge>
                </div>
                <div>
                  <Label>Segmento</Label>
                  <Badge 
                    variant={BADGE_VARIANTS[selectedCustomer.badge].variant}
                    className={BADGE_VARIANTS[selectedCustomer.badge].className}
                  >
                    {BADGE_LABELS[selectedCustomer.badge]}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total de Pedidos</Label>
                  <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <Label>Total Gasto</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                </div>
                <div>
                  <Label>Ticket Médio</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.averageTicket)}</p>
                </div>
                <div>
                  <Label>Último Pedido</Label>
                  <p className="text-2xl font-bold">{formatDate(selectedCustomer.lastOrderAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersCRMPageWithPermission() {
  return (
    <PermissionGuard permission={CUSTOMERS_CRM_PERMISSIONS.VIEW}>
      <CustomersCRMPageContent />
    </PermissionGuard>
  );
}

export const CustomersCRMPage = withModuleGuard(CustomersCRMPageWithPermission, 'customers-crm');
