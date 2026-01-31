import React from 'react';
import { adminApi } from '../lib/adminApi';

interface WhiteLabelConfig {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
}

export function AdminWhiteLabelPage() {
  const [tenantId, setTenantId] = React.useState('');
  const [config, setConfig] = React.useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  async function fetchConfig() {
    if (!tenantId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await adminApi.get<WhiteLabelConfig>(`/white-label/${tenantId}`);
      setConfig(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar white-label';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!tenantId || !config) return;
    setFeedback(null);
    try {
      await adminApi.patch(`/white-label/${tenantId}`, {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        logo: config.logo,
      });
      setFeedback('White-label atualizado');
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao salvar white-label';
      setFeedback(message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">White Label</h1>
      <div className="rounded bg-white p-4 shadow space-y-4">
        <div className="flex gap-2">
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Tenant ID"
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            onClick={fetchConfig}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            style={{ minHeight: 44 }}
          >
            Buscar
          </button>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : config ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Primary color</label>
              <input
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config!, primaryColor: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary color</label>
              <input
                value={config.secondaryColor}
                onChange={(e) => setConfig({ ...config!, secondaryColor: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                value={config.logo || ''}
                onChange={(e) => setConfig({ ...config!, logo: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <button
              onClick={saveConfig}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              style={{ minHeight: 44 }}
            >
              Salvar
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">Informe um Tenant ID para visualizar</p>
        )}
        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      </div>
    </div>
  );
}
