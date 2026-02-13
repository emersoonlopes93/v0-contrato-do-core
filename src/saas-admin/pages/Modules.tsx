import React from 'react';
import { adminApi } from '@/src/saas-admin/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import {
  Puzzle,
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Power,
  PowerOff,
  AlertCircle,
  Shield,
  Calendar,
  Settings,
  Loader2,
  TrendingUp,
  Package,
  Megaphone,
  Bot,
  Plug,
  Cog,
  Eye,
  Crown,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';
import type { SaaSAdminModuleDTO, SaaSAdminTenantDTO } from '@/src/types/saas-admin';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';

type ModuleDef = SaaSAdminModuleDTO & {
  category: 'essential' | 'sales' | 'marketing' | 'operations' | 'automation' | 'integrations' | 'advanced';
  status: 'active' | 'inactive' | 'premium' | 'beta';
  hasPreview?: boolean;
  price?: string;
  typeLabel: 'Core' | 'Feature' | 'Experimental';
};

const moduleCategories = {
  essential: {
    name: 'Essenciais',
    description: 'Ferramentas fundamentais para sua operação',
    icon: Package,
  },
  sales: {
    name: 'Vendas',
    description: 'Aumente suas conversões e receita',
    icon: TrendingUp,
  },
  marketing: {
    name: 'Marketing',
    description: 'Ferramentas para atrair e reter clientes',
    icon: Megaphone,
  },
  operations: {
    name: 'Operação',
    description: 'Otimize seus processos operacionais',
    icon: Cog,
  },
  automation: {
    name: 'Automação / IA',
    description: 'Automatize tarefas com inteligência artificial',
    icon: Bot,
  },
  integrations: {
    name: 'Integrações',
    description: 'Conecte com outras plataformas',
    icon: Plug,
  },
  advanced: {
    name: 'Avançado',
    description: 'Recursos avançados para empresas maduras',
    icon: Settings,
  }
};

const statusConfig = {
  active: {
    label: 'Ativo',
    icon: CheckCircle,
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  inactive: {
    label: 'Inativo',
    icon: XCircle,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border/40',
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  beta: {
    label: 'Beta',
    icon: FlaskConical,
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
  },
};

const categoryColors = {
  essential: { bg: 'bg-primary/10', text: 'text-primary' },
  sales: { bg: 'bg-success/10', text: 'text-success' },
  marketing: { bg: 'bg-info/10', text: 'text-info' },
  operations: { bg: 'bg-warning/10', text: 'text-warning' },
  automation: { bg: 'bg-primary/10', text: 'text-primary' },
  integrations: { bg: 'bg-secondary/20', text: 'text-foreground' },
  advanced: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const GLOBAL_MODULES_KEY = 'saas_admin_global_modules';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readGlobalModules(): Record<string, boolean> {
  const raw = localStorage.getItem(GLOBAL_MODULES_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const entries = Object.entries(parsed).filter(([, v]) => typeof v === 'boolean');
    return Object.fromEntries(entries) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function AdminModulesPage() {
  const [modules, setModules] = React.useState<ModuleDef[]>([]);
  const [tenants, setTenants] = React.useState<SaaSAdminTenantDTO[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | ModuleDef['status']>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | ModuleDef['typeLabel']>('all');
  const [globalModules, setGlobalModules] = React.useState<Record<string, boolean>>(() => readGlobalModules());
  const [detailsModule, setDetailsModule] = React.useState<ModuleDef | null>(null);
  const [detailsTenants, setDetailsTenants] = React.useState<SaaSAdminTenantDTO[]>([]);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [tenantCache, setTenantCache] = React.useState<Record<string, SaaSAdminTenantDTO[]>>({});

  const fetchModules = React.useCallback(
    async (tenantId?: string) => {
      setLoading(true);
      try {
        const params = tenantId ? { tenantId } : undefined;
        const data = await adminApi.get<SaaSAdminModuleDTO[]>('/modules', params);
        const enriched: ModuleDef[] = data.map((m) => {
          const typeLabel: ModuleDef['typeLabel'] =
            m.type === 'core' ? 'Core' : m.type === 'experimental' ? 'Experimental' : 'Feature';
          const globalEnabled = globalModules[m.id] ?? true;
          return {
            ...m,
            category: 'essential',
            status: globalEnabled ? (m.isActiveForTenant ? 'active' : 'inactive') : 'inactive',
            typeLabel,
          };
        });
        setModules(enriched);
        setError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Falha ao carregar módulos';
        setError(message);
        toast({ title: 'Falha ao carregar módulos', description: String(message), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [globalModules]
  );

  React.useEffect(() => {
    (async () => {
      try {
        const tenantsData = await adminApi.get<SaaSAdminTenantDTO[]>('/tenants');
        setTenants(tenantsData);
      } catch {
        setTenants([]);
      }
      const params = new URLSearchParams(window.location.search);
      const tenantId = params.get('tenantId');
      if (tenantId) {
        setSelectedTenantId(tenantId);
        await fetchModules(tenantId);
      } else {
        await fetchModules();
      }
    })();
  }, [fetchModules]);

  const handleTenantChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = event.target.value;
    setSelectedTenantId(tenantId);
    await fetchModules(tenantId || undefined);
  };

  const toggleModule = async (moduleId: string, isActive: boolean) => {
    if (!selectedTenantId) {
      toast({ title: 'Selecione um tenant', description: 'Escolha um tenant para gerenciar módulos' });
      return;
    }

    setIsUpdating(true);
    try {
      const endpoint = isActive
        ? `/tenants/${selectedTenantId}/modules/${moduleId}/deactivate`
        : `/tenants/${selectedTenantId}/modules/${moduleId}/activate`;

      await adminApi.post(endpoint, {});
      await fetchModules(selectedTenantId);
      toast({
        title: isActive ? 'Módulo desativado' : 'Módulo ativado',
        description: `Módulo ${moduleId} ${isActive ? 'desativado' : 'ativado'} para o tenant`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao atualizar módulo';
      setError(message);
      toast({ title: 'Erro ao atualizar módulo', description: String(message), variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  React.useEffect(() => {
    localStorage.setItem(GLOBAL_MODULES_KEY, JSON.stringify(globalModules));
  }, [globalModules]);

  const moduleDependencies = React.useMemo<Record<string, string[]>>(() => ({}), []);

  const toggleGlobalModule = (module: ModuleDef) => {
    if (module.canDisable === false) {
      toast({ title: 'Módulo Core', description: 'Módulos Core não podem ser desativados' });
      return;
    }

    const current = globalModules[module.id] ?? true;
    const dependencies = moduleDependencies[module.id] ?? [];
    if (current && dependencies.length > 0) {
      toast({
        title: 'Desativação bloqueada',
        description: 'Dependências ativas impedem a desativação',
        variant: 'destructive',
      });
      return;
    }

    const updated = { ...globalModules, [module.id]: !current };
    setGlobalModules(updated);
    toast({
      title: !current ? 'Módulo global ativado' : 'Módulo global desativado',
      description: module.name,
    });
  };

  const openDetails = async (module: ModuleDef) => {
    setDetailsModule(module);
    const cachedTenants = tenantCache[module.id];
    if (cachedTenants) {
      setDetailsTenants(cachedTenants);
      return;
    }
    setDetailsLoading(true);
    try {
      const responses = await Promise.all(
        tenants.map(async (tenant) => {
          const list = await adminApi.get<SaaSAdminModuleDTO[]>('/modules', { tenantId: tenant.id });
          const active = list.find((item) => item.id === module.id)?.isActiveForTenant ?? false;
          return active ? tenant : null;
        })
      );
      const activeTenants = responses.filter((tenant): tenant is SaaSAdminTenantDTO => tenant !== null);
      setDetailsTenants(activeTenants);
      setTenantCache((prev) => ({ ...prev, [module.id]: activeTenants }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar tenants';
      toast({ title: 'Falha ao carregar tenants', description: String(message), variant: 'destructive' });
      setDetailsTenants([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsModule(null);
    setDetailsTenants([]);
  };

  // Filtros
  const filteredModules = React.useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || module.status === statusFilter;
      const matchesType = typeFilter === 'all' || module.typeLabel === typeFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    });
  }, [modules, searchTerm, selectedCategory, statusFilter, typeFilter]);

  // Agrupar por categoria
  const modulesByCategory = React.useMemo(() => {
    const grouped: Record<string, ModuleDef[]> = {};
    Object.keys(moduleCategories).forEach(category => {
      grouped[category] = filteredModules.filter(m => m.category === category);
    });
    return grouped;
  }, [filteredModules]);

  return (
    <div className="saas-admin-app min-h-screen bg-gradient-to-br from-background-app via-background to-background-surface">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container-responsive mx-auto px-4 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Puzzle className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Marketplace de Módulos</h1>
                <p className="text-muted-foreground mt-1">Descubra e gerencie as funcionalidades para seu negócio</p>
              </div>
            </div>
            
            {/* Tenant Selector */}
            <div className="flex items-center gap-4">
            <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedTenantId}
                onChange={handleTenantChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
                >
                  <option value="">Selecione um tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              </div>
              {selectedTenantId && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {tenants.find(t => t.id === selectedTenantId)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
            >
              <option value="all">Todas as categorias</option>
              {Object.entries(moduleCategories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.name}
                </option>
              ))}
            </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ModuleDef['status'])}
            className="px-4 py-3 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="premium">Premium</option>
            <option value="beta">Beta</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ModuleDef['typeLabel'])}
            className="px-4 py-3 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="Core">Core</option>
            <option value="Feature">Feature</option>
            <option value="Experimental">Experimental</option>
          </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{filteredModules.length} módulos encontrados</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-danger" />
            <span className="text-sm text-danger">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Carregando marketplace...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Categories */}
            {Object.entries(moduleCategories).map(([categoryKey, category]) => {
              const categoryModules = modulesByCategory[categoryKey] || [];
              if (categoryModules.length === 0) return null;
              const CategoryIcon = category.icon;
              const color = categoryColors[categoryKey as keyof typeof categoryColors];
              return (
                <div key={categoryKey} className="space-y-6">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-card/80 hover:shadow-lg"
                    onClick={() => setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color.bg}`}>
                        <CategoryIcon className={`h-6 w-6 ${color.text}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
                        <p className="text-muted-foreground mt-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                        {categoryModules.length} módulos
                      </span>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expandedCategory === categoryKey ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Modules Grid */}
                  {expandedCategory === categoryKey && (
                    <div className="grid grid-responsive gap-6">
                      {categoryModules.map((module) => {
                        const statusInfo = statusConfig[module.status];
                        const StatusIcon = statusInfo.icon;
                        const globalEnabled = globalModules[module.id] ?? true;
                        
                        return (
                          <div key={module.id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/30">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>

                            {/* Module Content */}
                            <div className="p-6">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                                    <Puzzle className="h-6 w-6 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-foreground">{module.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        v{module.version}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        {module.typeLabel}
                                      </span>
                                      {module.price && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                          {module.price}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Price Badge */}
                                {module.status === 'premium' && (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                    <Crown className="h-3 w-3" />
                                    <span>Premium</span>
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                                {module.description}
                              </p>

                              {/* Features */}
                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Shield className="h-4 w-4" />
                                  <span>{module.permissions ? `${module.permissions.length} permissões` : 'Básico'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>{module.eventTypes ? `${module.eventTypes.length} eventos` : 'Padrão'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Settings className="h-4 w-4" />
                                  <span>{globalEnabled ? 'Global ativo' : 'Global inativo'}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {module.hasPreview && (
                                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200">
                                    <Eye className="h-4 w-4" />
                                    <span>Preview</span>
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => openDetails(module)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200"
                                >
                                  <Settings className="h-4 w-4" />
                                  <span>Detalhes</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => toggleGlobalModule(module)}
                                  disabled={module.canDisable === false}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200 ${module.canDisable === false ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {globalEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                  <span>{globalEnabled ? 'Global off' : 'Global on'}</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={!selectedTenantId || isUpdating}
                                  onClick={() => toggleModule(module.id, module.isActiveForTenant)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    module.isActiveForTenant
                                      ? 'bg-danger text-danger-foreground hover:bg-danger/90 shadow-lg hover:shadow-xl'
                                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
                                  } ${!selectedTenantId || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {module.isActiveForTenant ? (
                                    <>
                                      <PowerOff className="h-4 w-4" />
                                      <span>Desativar</span>
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4" />
                                      <span>Ativar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BaseModal open={Boolean(detailsModule)} onOpenChange={(open) => (!open ? closeDetails() : null)} size="lg">
        <ModalHeader title={detailsModule?.name ?? 'Detalhes do módulo'} />
        <ModalBody>
          {detailsModule && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/40 p-4">
                  <p className="text-sm text-muted-foreground">Versão</p>
                  <p className="font-semibold text-foreground">v{detailsModule.version}</p>
                </div>
                <div className="rounded-xl border border-border/40 p-4">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold text-foreground">{detailsModule.typeLabel}</p>
                </div>
                <div className="rounded-xl border border-border/40 p-4">
                  <p className="text-sm text-muted-foreground">Status global</p>
                  <p className="font-semibold text-foreground">
                    {globalModules[detailsModule.id] ?? true ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border/40 p-4">
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm text-foreground mt-2">{detailsModule.description ?? 'Sem descrição'}</p>
              </div>
              <div className="rounded-xl border border-border/40 p-4">
                <p className="text-sm text-muted-foreground">Dependências</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(moduleDependencies[detailsModule.id] ?? []).length === 0 ? (
                    <span className="text-sm text-muted-foreground">Sem dependências registradas</span>
                  ) : (
                    (moduleDependencies[detailsModule.id] ?? []).map((dep) => (
                      <span key={dep} className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {dep}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Tenants usando o módulo</p>
                  <span className="text-sm text-muted-foreground">{detailsTenants.length}</span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando tenants...
                  </div>
                ) : detailsTenants.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Nenhum tenant ativo no módulo</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detailsTenants.map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{tenant.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={closeDetails}
            className="rounded-lg border border-border/40 px-4 py-2 text-sm font-medium hover:bg-accent transition-colors duration-200"
          >
            Fechar
          </button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
}
