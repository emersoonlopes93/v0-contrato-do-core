import React from 'react';
import { adminApi } from '../lib/adminApi';

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modules</h1>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="tenant-select" className="text-sm font-medium">
            Tenant:
          </label>
          <select
            id="tenant-select"
            value={selectedTenantId}
            onChange={handleTenantChange}
            className="rounded border px-3 py-2 bg-white text-sm"
          >
            <option value="">Selecione um tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </select>
        </div>
        {isUpdating && (
          <span className="text-xs text-muted-foreground">Atualizando módulos...</span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded bg-white shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : modules.length === 0 ? (
          <p className="p-4 text-muted-foreground">Nenhum módulo registrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3">Nome</th>
                <th className="p-3">ID</th>
                <th className="p-3">Versão</th>
                <th className="p-3">Permissões</th>
                <th className="p-3">Eventos</th>
                <th className="p-3">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-semibold">{m.name}</td>
                  <td className="p-3 text-muted-foreground">{m.id}</td>
                  <td className="p-3 text-muted-foreground">v{m.version}</td>
                  <td className="p-3">
                    {Array.isArray(m.permissions) && m.permissions.length > 0
                      ? m.permissions
                          .map((permission) =>
                            typeof permission === 'string' ? permission : permission.id
                          )
                          .join(', ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    {Array.isArray(m.eventTypes) && m.eventTypes.length > 0
                      ? m.eventTypes
                          .map((eventType) =>
                            typeof eventType === 'string' ? eventType : eventType.id
                          )
                          .join(', ')
                      : '—'}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={!selectedTenantId || isUpdating}
                      onClick={() => toggleModule(m.id, m.isActiveForTenant)}
                      className={`rounded px-3 py-2 text-xs font-medium ${
                        m.isActiveForTenant
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      } ${!selectedTenantId || isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {m.isActiveForTenant ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
