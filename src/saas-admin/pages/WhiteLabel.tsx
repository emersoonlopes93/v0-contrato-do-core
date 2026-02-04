import React from 'react';
import { adminApi } from '../lib/adminApi';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import { Button } from '@/components/ui/button';

interface WhiteLabelConfig {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  theme?: 'light' | 'dark';
}

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
}

const DEFAULT_PRIMARY_COLOR = '0 0% 9%';
const DEFAULT_SECONDARY_COLOR = '0 0% 96.1%';
const DEFAULT_BACKGROUND_COLOR = '0 0% 100%';

export function AdminWhiteLabelPage() {
  const [tenantId, setTenantId] = React.useState('');
  const [config, setConfig] = React.useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [tenants, setTenants] = React.useState<TenantSummary[]>([]);
  const [tenantsLoading, setTenantsLoading] = React.useState(false);
  const [tenantSearch, setTenantSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const loadTenants = async () => {
      setTenantsLoading(true);
      try {
        const data = await adminApi.get<TenantSummary[]>('/tenants');
        setTenants(data);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Erro ao carregar tenants';
        setFeedback(message);
      } finally {
        setTenantsLoading(false);
      }
    };

    void loadTenants();
  }, []);

  const filteredTenants = React.useMemo(() => {
    const query = tenantSearch.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (statusFilter && tenant.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        tenant.name.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query) ||
        tenant.id.toLowerCase().includes(query)
      );
    });
  }, [tenants, tenantSearch, statusFilter]);

  const colorPresets = React.useMemo(
    () => [
      '0 0% 9%',
      '221.2 83.2% 53.3%',
      '142.1 76.2% 36.3%',
      '346.8 77.2% 49.8%',
      '25 95% 53%',
    ],
    [],
  );

  async function fetchConfig(targetTenantId?: string) {
    const currentTenantId = targetTenantId ?? tenantId;
    if (!currentTenantId) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const data = await adminApi.get<WhiteLabelConfig | null>(
        `/white-label/${currentTenantId}`,
      );
      if (!data) {
        setConfig({
          tenantId: currentTenantId,
          primaryColor: DEFAULT_PRIMARY_COLOR,
          secondaryColor: DEFAULT_SECONDARY_COLOR,
          backgroundColor: DEFAULT_BACKGROUND_COLOR,
        });
        return;
      }
      setConfig({
        tenantId: data.tenantId,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        backgroundColor: data.backgroundColor,
        logo: data.logo,
        theme: data.theme,
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar white-label';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!tenantId || !config) {
      return;
    }
    setFeedback(null);
    try {
      await adminApi.patch(`/white-label/${tenantId}`, {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        logo: config.logo,
        theme: config.theme,
      });
      setFeedback('White-label atualizado');
      setIsModalOpen(false);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao salvar white-label';
      setFeedback(message);
    }
  }

  async function handleSelectTenant(id: string) {
    setTenantId(id);
    await fetchConfig(id);
    setIsModalOpen(true);
  }

  function handleResetColors() {
    setConfig((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        secondaryColor: DEFAULT_SECONDARY_COLOR,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
      };
    });
  }

  function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setConfig((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            logo: result,
          };
        });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">White Label</h1>
      <div className="rounded bg-card p-4 shadow-md space-y-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={tenantSearch}
              onChange={(event) => setTenantSearch(event.target.value)}
              placeholder="Buscar tenant por nome, slug ou ID"
              className="flex-1 rounded border px-3 py-2"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-40 rounded border px-3 py-2"
            >
              <option value="">Todos status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="deleted">Deletado</option>
            </select>
          </div>
          <div className="rounded border bg-background max-h-56 overflow-auto">
            {tenantsLoading ? (
              <p className="p-3 text-sm text-muted-foreground">
                Carregando tenants...
              </p>
            ) : filteredTenants.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                Nenhum tenant encontrado
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Slug</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-t">
                      <td className="p-2">{tenant.name}</td>
                      <td className="p-2">{tenant.slug}</td>
                      <td className="p-2">{tenant.status}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectTenant(tenant.id)}
                          className="rounded-md border px-3 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
                        >
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            placeholder="Tenant ID"
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            type="button"
            onClick={() => {
              void fetchConfig();
              setIsModalOpen(true);
            }}
            className="rounded-md bg-[hsl(var(--action-primary-safe))] px-4 py-2 text-sm font-medium text-[hsl(var(--action-primary-foreground-safe))] hover:bg-[hsl(var(--action-primary-safe)/0.9)]"
          >
            Buscar
          </button>
        </div>
        {feedback && (
          <p className="text-sm text-muted-foreground">{feedback}</p>
        )}
      </div>
      <BaseModal
        open={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
        size="md"
      >
        <ModalHeader title="Editar White-label" />
        <ModalBody>
          {loading ? (
            <p>Carregando...</p>
          ) : !config ? (
            <p className="text-sm text-muted-foreground">
              Selecione um tenant para visualizar a configuração.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Primary color
                </label>
                <input
                  value={config.primaryColor}
                  onChange={(event) =>
                    setConfig(
                      config
                        ? {
                            ...config,
                            primaryColor: event.target.value,
                          }
                        : config,
                    )
                  }
                  className="w-full rounded border px-3 py-2"
                />
                <div className="mt-2 flex gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={`primary-${color}`}
                      type="button"
                      onClick={() =>
                        setConfig(
                          config
                            ? {
                                ...config,
                                primaryColor: color,
                              }
                            : config,
                        )
                      }
                      className="h-7 w-7 rounded border"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Secondary color
                </label>
                <input
                  value={config.secondaryColor}
                  onChange={(event) =>
                    setConfig(
                      config
                        ? {
                            ...config,
                            secondaryColor: event.target.value,
                          }
                        : config,
                    )
                  }
                  className="w-full rounded border px-3 py-2"
                />
                <div className="mt-2 flex gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={`secondary-${color}`}
                      type="button"
                      onClick={() =>
                        setConfig(
                          config
                            ? {
                                ...config,
                                secondaryColor: color,
                              }
                            : config,
                        )
                      }
                      className="h-7 w-7 rounded border"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Background color
                </label>
                <input
                  value={config.backgroundColor || ''}
                  onChange={(event) =>
                    setConfig(
                      config
                        ? {
                            ...config,
                            backgroundColor: event.target.value || undefined,
                          }
                        : config,
                    )
                  }
                  className="w-full rounded border px-3 py-2"
                />
                <div className="mt-2 flex gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={`background-${color}`}
                      type="button"
                      onClick={() =>
                        setConfig(
                          config
                            ? {
                                ...config,
                                backgroundColor: color,
                              }
                            : config,
                        )
                      }
                      className="h-7 w-7 rounded border"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetColors}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Restaurar cores padrão
              </button>
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tema
                </label>
                <select
                  value={config.theme || 'light'}
                  onChange={(event) =>
                    setConfig(
                      config
                        ? {
                            ...config,
                            theme:
                              event.target.value === 'dark' ? 'dark' : 'light',
                          }
                        : config,
                    )
                  }
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => setIsModalOpen(false)}
          >
            Fechar
          </Button>
          <Button
            type="button"
            className="h-10"
            onClick={saveConfig}
            disabled={loading || !config}
          >
            Salvar
          </Button>
        </ModalFooter>
      </BaseModal>
    </div>
  );
}
