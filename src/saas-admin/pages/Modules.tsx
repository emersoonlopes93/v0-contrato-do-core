import React from 'react';
import { adminApi } from '../lib/adminApi';
import {
  Puzzle,
  Building2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Power,
  PowerOff,
  AlertCircle,
  Shield,
  Calendar,
  Settings,
  Info,
  Loader2,
  Star,
  Zap,
  TrendingUp,
  Package,
  Users,
  Megaphone,
  Bot,
  Plug,
  Cog,
  Eye,
  Crown,
  FlaskConical,
  ChevronRight
} from 'lucide-react';

interface ModuleDef {
  id: string;
  name: string;
  version: string;
  description?: string;
  category: 'essential' | 'sales' | 'marketing' | 'operations' | 'automation' | 'integrations' | 'advanced';
  status: 'active' | 'inactive' | 'premium' | 'beta';
  permissions: { id: string; name: string; description: string }[] | string[] | undefined;
  eventTypes: { id: string; name: string; description: string }[] | string[] | undefined;
  slug: string;
  isActiveForTenant: boolean;
  hasPreview?: boolean;
  price?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

const moduleCategories = {
  essential: {
    name: 'Essenciais',
    description: 'Ferramentas fundamentais para sua operação',
    icon: Package,
    color: 'blue'
  },
  sales: {
    name: 'Vendas',
    description: 'Aumente suas conversões e receita',
    icon: TrendingUp,
    color: 'green'
  },
  marketing: {
    name: 'Marketing',
    description: 'Ferramentas para atrair e reter clientes',
    icon: Megaphone,
    color: 'purple'
  },
  operations: {
    name: 'Operação',
    description: 'Otimize seus processos operacionais',
    icon: Cog,
    color: 'orange'
  },
  automation: {
    name: 'Automação / IA',
    description: 'Automatize tarefas com inteligência artificial',
    icon: Bot,
    color: 'pink'
  },
  integrations: {
    name: 'Integrações',
    description: 'Conecte com outras plataformas',
    icon: Plug,
    color: 'cyan'
  },
  advanced: {
    name: 'Avançado',
    description: 'Recursos avançados para empresas maduras',
    icon: Settings,
    color: 'slate'
  }
};

const statusConfig = {
  active: {
    label: 'Ativo',
    color: 'success',
    icon: CheckCircle
  },
  inactive: {
    label: 'Inativo',
    color: 'muted',
    icon: XCircle
  },
  premium: {
    label: 'Premium',
    color: 'warning',
    icon: Crown
  },
  beta: {
    label: 'Beta',
    color: 'info',
    icon: FlaskConical
  }
};

export function AdminModulesPage() {
  const [modules, setModules] = React.useState<ModuleDef[]>([]);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const fetchModules = React.useCallback(
    async (tenantId?: string) => {
      setLoading(true);
      try {
        const params = tenantId ? { tenantId } : undefined;
        const data = await adminApi.get<ModuleDef[]>('/modules', params);
        setModules(data);
        setError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Falha ao carregar módulos';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    (async () => {
      try {
        const tenantsData = await adminApi.get<Tenant[]>('/tenants');
        setTenants(tenantsData);
      } catch {
        setTenants([]);
      } finally {
        fetchModules();
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
      return;
    }

    setIsUpdating(true);
    try {
      const endpoint = isActive
        ? `/tenants/${selectedTenantId}/modules/${moduleId}/deactivate`
        : `/tenants/${selectedTenantId}/modules/${moduleId}/activate`;

      await adminApi.post(endpoint, {});
      await fetchModules(selectedTenantId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao atualizar módulo';
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Mock data para demonstração - substituir com dados reais
  const mockModules: ModuleDef[] = [
    {
      id: 'core-pos',
      name: 'PDV Core',
      version: '2.1.0',
      description: 'Sistema completo de ponto de venda com gestão de pedidos e pagamentos',
      category: 'essential',
      status: 'active',
      isActiveForTenant: true,
      hasPreview: true,
      price: 'Grátis',
      permissions: [],
      eventTypes: [],
      slug: 'core-pos'
    },
    {
      id: 'delivery-manager',
      name: 'Gestor de Entregas',
      version: '1.5.2',
      description: 'Controle completo de entregadores com roteirização e tracking em tempo real',
      category: 'operations',
      status: 'active',
      isActiveForTenant: true,
      hasPreview: true,
      price: 'R$ 99/mês',
      permissions: [],
      eventTypes: [],
      slug: 'delivery-manager'
    },
    {
      id: 'loyalty-program',
      name: 'Programa de Fidelidade',
      version: '3.0.0',
      description: 'Crie programas de pontos e recompensas para fidelizar clientes',
      category: 'marketing',
      status: 'premium',
      isActiveForTenant: false,
      hasPreview: true,
      price: 'R$ 199/mês',
      permissions: [],
      eventTypes: [],
      slug: 'loyalty-program'
    },
    {
      id: 'ai-assistant',
      name: 'Assistente IA',
      version: '1.0.0-beta',
      description: 'Assistente inteligente para automação de atendimento e previsões',
      category: 'automation',
      status: 'beta',
      isActiveForTenant: false,
      hasPreview: false,
      price: 'Em breve',
      permissions: [],
      eventTypes: [],
      slug: 'ai-assistant'
    },
    {
      id: 'analytics-pro',
      name: 'Analytics Pro',
      version: '2.3.1',
      description: 'Análise avançada de dados com dashboards personalizáveis e ML',
      category: 'advanced',
      status: 'premium',
      isActiveForTenant: false,
      hasPreview: true,
      price: 'R$ 299/mês',
      permissions: [],
      eventTypes: [],
      slug: 'analytics-pro'
    }
  ];

  // Simular carregamento
  React.useEffect(() => {
    setTimeout(() => {
      setModules(mockModules);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtros
  const filteredModules = React.useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           module.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchTerm, selectedCategory]);

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
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    // fetchModules(e.target.value || undefined);
                  }}
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
          <div className="flex flex-1 gap-4">
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
              
              return (
                <div key={categoryKey} className="space-y-6">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-card/80 hover:shadow-lg"
                    onClick={() => setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${category.color}/10`}>
                        <category.icon className={`h-6 w-6 text-${category.color}`} />
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
                        
                        return (
                          <div key={module.id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/30">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}/10 text-${statusInfo.color} border border-${statusInfo.color}/20`}>
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
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {module.hasPreview && (
                                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200">
                                    <Eye className="h-4 w-4" />
                                    <span>Preview</span>
                                  </button>
                                )}
                                
                                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200">
                                  <Settings className="h-4 w-4" />
                                  <span>Configurar</span>
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
    </div>
  );
}
