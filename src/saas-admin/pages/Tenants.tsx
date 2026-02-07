import React from 'react';
import { adminApi } from '@/src/saas-admin/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Power,
  PowerOff,
  AlertCircle,
  UserCheck,
  Calendar,
  Settings
} from 'lucide-react';
import type { SaaSAdminPlanDTO, SaaSAdminTenantDTO, SaaSAdminTenantStatus } from '@/src/types/saas-admin';

export function AdminTenantsPage() {
  const [tenants, setTenants] = React.useState<SaaSAdminTenantDTO[]>([]);
  const [plans, setPlans] = React.useState<SaaSAdminPlanDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [planId, setPlanId] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<SaaSAdminTenantStatus | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  async function fetchTenants() {
    setLoading(true);
    try {
      const data = await adminApi.get<SaaSAdminTenantDTO[]>('/tenants');
      setTenants(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar tenants';
      toast({ title: 'Falha ao carregar tenants', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlans() {
    try {
      const data = await adminApi.get<SaaSAdminPlanDTO[]>('/plans');
      setPlans(data);
      if (data.length > 0) {
        setPlanId(data[0].id);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar planos';
      toast({ title: 'Falha ao carregar planos', description: message, variant: 'destructive' });
    }
  }

  React.useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi.post('/tenants', { name, slug, planId });
      setName('');
      setSlug('');
      if (plans.length > 0) {
        setPlanId(plans[0].id);
      }
      await fetchTenants();
      toast({ title: 'Tenant criado', description: 'Tenant criado com sucesso' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao criar tenant';
      toast({ title: 'Falha ao criar tenant', description: message, variant: 'destructive' });
    }
  }

  async function updateStatus(id: string, status: 'active' | 'suspended') {
    const confirmText = status === 'active' ? 'Reativar este tenant?' : 'Suspender este tenant?';
    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      await adminApi.patch(`/tenants/${id}/status`, { status });
      await fetchTenants();
      toast({ title: 'Status atualizado', description: 'Status atualizado com sucesso' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao atualizar status';
      toast({ title: 'Falha ao atualizar status', description: message, variant: 'destructive' });
    }
  }

  function handleImpersonate(tenant: SaaSAdminTenantDTO) {
    if (!window.confirm(`Acessar tenant ${tenant.name}?`)) {
      return;
    }
    toast({
      title: 'Ação indisponível',
      description: 'Impersonate ainda não está habilitado',
      variant: 'destructive',
    });
  }

  function handleResetTenant(tenant: SaaSAdminTenantDTO) {
    if (!window.confirm(`Resetar configurações do tenant ${tenant.name}?`)) {
      return;
    }
    toast({
      title: 'Ação indisponível',
      description: 'Reset de configurações ainda não está habilitado',
      variant: 'destructive',
    });
  }

  const filteredTenants = React.useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesSearch =
        normalized.length === 0 ||
        tenant.name.toLowerCase().includes(normalized) ||
        tenant.slug.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTenants = filteredTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const path = window.location.pathname;
  const selectedTenantId = path.startsWith('/admin/tenants/')
    ? path.split('/').filter(Boolean).slice(-1)[0]
    : null;
  const selectedTenant = selectedTenantId
    ? tenants.find((t) => t.id === selectedTenantId)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            Tenants
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os tenants do seu ecossistema</p>
        </div>
        <a
          href="/admin/tenants/create"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Onboarding Controlado
        </a>
      </div>

      {/* Quick Create Form */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Tenant (Rápido)
          </h2>
        </div>
        <form onSubmit={createTenant} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome do Tenant
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Empresa"
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Slug
              </label>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="minha-empresa"
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Plano
              </label>
              <select
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="" disabled>Selecione um plano</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={!planId}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Tenant
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Selected Tenant Details */}
      {selectedTenant && (
        <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Tenant
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Nome</span>
                </div>
                <p className="font-semibold text-foreground">{selectedTenant.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Slug</span>
                </div>
                <p className="font-semibold text-foreground">{selectedTenant.slug}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    selectedTenant.status === 'active' 
                      ? 'bg-success' 
                      : selectedTenant.status === 'suspended' 
                      ? 'bg-warning' 
                      : 'bg-muted'
                  }`} />
                  <p className="font-semibold text-foreground capitalize">{selectedTenant.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>Onboarded</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTenant.onboarded ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <p className="font-semibold text-foreground">
                    {selectedTenant.onboarded ? 'Sim' : 'Não'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Plano</span>
                </div>
                <p className="font-semibold text-foreground">
                  {selectedTenant.plan?.name ?? 'Não definido'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Último acesso</span>
                </div>
                <p className="font-semibold text-foreground">
                  {selectedTenant.last_access_at
                    ? new Date(selectedTenant.last_access_at).toLocaleString('pt-BR')
                    : '-'}
                </p>
              </div>
            </div>
            {selectedTenant.created_at && (
              <div className="mt-6 pt-6 border-t border-border/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em</span>
                </div>
                <p className="font-semibold text-foreground mt-1">
                  {new Date(selectedTenant.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tenants List */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Todos os Tenants ({filteredTenants.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SaaSAdminTenantStatus | 'all')}
                  className="pl-10 pr-8 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="pending">Onboarding</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Carregando tenants...</p>
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nenhum tenant</h3>
                <p className="text-muted-foreground">Crie seu primeiro tenant para começar</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tenant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Onboarding</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Plano</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Último acesso</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden sm:table-cell">Criado em</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {pagedTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          t.status === 'active' 
                            ? 'bg-success' 
                            : t.status === 'suspended' 
                            ? 'bg-warning' 
                            : 'bg-muted'
                        }`} />
                        <span className="text-sm font-medium capitalize text-foreground">
                          {t.status === 'active' ? 'Ativo' : t.status === 'suspended' ? 'Suspenso' : t.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.onboarded ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Completo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Pendente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {t.plan?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {t.last_access_at ? new Date(t.last_access_at).toLocaleString('pt-BR') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {t.created_at ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(t)}
                          className="flex items-center gap-1 rounded-lg border border-border/40 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors duration-200"
                          title="Acessar tenant"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span className="hidden sm:inline">Acessar</span>
                        </button>
                        {t.status !== 'active' && (
                          <button
                            onClick={() => updateStatus(t.id, 'active')}
                            className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:bg-success/90 transition-colors duration-200"
                            title="Ativar tenant"
                          >
                            <Power className="h-3 w-3" />
                            <span className="hidden sm:inline">Ativar</span>
                          </button>
                        )}
                        {t.status !== 'suspended' && (
                          <button
                            onClick={() => updateStatus(t.id, 'suspended')}
                            className="flex items-center gap-1 rounded-lg bg-warning px-3 py-2 text-xs font-medium text-warning-foreground hover:bg-warning/90 transition-colors duration-200"
                            title="Suspender tenant"
                          >
                            <PowerOff className="h-3 w-3" />
                            <span className="hidden sm:inline">Suspender</span>
                          </button>
                        )}
                        <a
                          href={`/admin/tenants/${t.id}`}
                          className="flex items-center gap-1 rounded-lg border border-border/40 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors duration-200"
                          title="Ver detalhes"
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </a>
                        <a
                          href={`/admin/modules?tenantId=${t.id}`}
                          className="flex items-center gap-1 rounded-lg border border-border/40 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors duration-200"
                          title="Ver módulos ativos"
                        >
                          <Settings className="h-3 w-3" />
                          <span className="hidden sm:inline">Módulos</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleResetTenant(t)}
                          className="flex items-center gap-1 rounded-lg bg-danger px-3 py-2 text-xs font-medium text-danger-foreground hover:bg-danger/90 transition-colors duration-200"
                          title="Resetar configurações"
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">Resetar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border/20 px-6 py-4">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-border/40 px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-border/40 px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
