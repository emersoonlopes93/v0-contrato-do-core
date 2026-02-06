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
  Loader2
} from 'lucide-react';

interface ModuleDef {
  id: string;
  name: string;
  version: string;
  permissions: { id: string; name: string; description: string }[] | string[] | undefined;
  eventTypes: { id: string; name: string; description: string }[] | string[] | undefined;
  slug: string;
  isActiveForTenant: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export function AdminModulesPage() {
  const [modules, setModules] = React.useState<ModuleDef[]>([]);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            Módulos
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os módulos disponíveis para seus tenants</p>
        </div>
      </div>

      {/* Tenant Selector */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecionar Tenant
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label htmlFor="tenant-select" className="block text-sm font-medium text-foreground mb-2">
                Escolha um tenant para gerenciar módulos
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  id="tenant-select"
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
            </div>
            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Atualizando módulos...</span>
              </div>
            )}
          </div>
          {selectedTenantId && (
            <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Gerenciando módulos para: {tenants.find(t => t.id === selectedTenantId)?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 text-danger border border-danger/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Modules List */}
      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Puzzle className="h-5 w-5" />
              Módulos Disponíveis ({modules.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar módulos..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/40 bg-background/50 hover:bg-accent transition-colors duration-200">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrar</span>
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Carregando módulos...</p>
            </div>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Puzzle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nenhum módulo</h3>
                <p className="text-muted-foreground">
                  {selectedTenantId 
                    ? 'Nenhum módulo disponível para este tenant' 
                    : 'Selecione um tenant para ver os módulos disponíveis'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Módulo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Versão</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Permissões</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Eventos</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {modules.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Puzzle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{m.name}</p>
                          <p className="text-sm text-muted-foreground">{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          v{m.version}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(m.permissions) && m.permissions.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {m.permissions.length} permissões
                          </span>
                          <div className="group relative">
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-background border border-border rounded-lg shadow-lg p-2 max-w-xs">
                                <p className="text-xs">
                                  {m.permissions
                                    .map((permission) =>
                                      typeof permission === 'string' ? permission : permission.id
                                    )
                                    .join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(m.eventTypes) && m.eventTypes.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {m.eventTypes.length} eventos
                          </span>
                          <div className="group relative">
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-background border border-border rounded-lg shadow-lg p-2 max-w-xs">
                                <p className="text-xs">
                                  {m.eventTypes
                                    .map((eventType) =>
                                      typeof eventType === 'string' ? eventType : eventType.id
                                    )
                                    .join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {m.isActiveForTenant ? (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Inativo</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          disabled={!selectedTenantId || isUpdating}
                          onClick={() => toggleModule(m.id, m.isActiveForTenant)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            m.isActiveForTenant
                              ? 'bg-danger text-danger-foreground hover:bg-danger/90 shadow-lg hover:shadow-xl'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
                          } ${!selectedTenantId || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {m.isActiveForTenant ? (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
