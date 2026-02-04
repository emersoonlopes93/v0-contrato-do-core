import React from 'react';
import { adminApi } from '../lib/adminApi';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at?: string;
  onboarded?: boolean;
}

interface Plan {
  id: string;
  name: string;
}

export function AdminTenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [planId, setPlanId] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);

  async function fetchTenants() {
    setLoading(true);
    try {
      const data = await adminApi.get<Tenant[]>('/tenants');
      setTenants(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao carregar tenants';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlans() {
    try {
      const data = await adminApi.get<Plan[]>('/plans');
      setPlans(data);
      if (data.length > 0) {
        setPlanId(data[0].id);
      }
    } catch (e: unknown) {
      console.error('Failed to fetch plans', e);
    }
  }

  React.useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await adminApi.post('/tenants', { name, slug, planId });
      setName('');
      setSlug('');
      // Reset planId to first plan if available
      if (plans.length > 0) {
        setPlanId(plans[0].id);
      }
      await fetchTenants();
      setFeedback('Tenant criado com sucesso');
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao criar tenant';
      setFeedback(message);
    }
  }

  async function updateStatus(id: string, status: 'active' | 'suspended') {
    setFeedback(null);
    try {
      await adminApi.patch(`/tenants/${id}/status`, { status });
      await fetchTenants();
      setFeedback('Status atualizado');
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erro ao atualizar status';
      setFeedback(message);
    }
  }

  const path = window.location.pathname;
  const selectedTenantId = path.startsWith('/admin/tenants/')
    ? path.split('/').filter(Boolean).slice(-1)[0]
    : null;
  const selectedTenant = selectedTenantId
    ? tenants.find((t) => t.id === selectedTenantId)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tenants</h1>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Criar Tenant (rápido)</h2>
        <a
          href="/admin/tenants/create"
          className="rounded-md bg-[hsl(var(--action-primary-safe))] px-4 py-2 text-sm font-medium text-[hsl(var(--action-primary-foreground-safe))] hover:bg-[hsl(var(--action-primary-safe)/0.9)]"
        >
          Onboarding Controlado
        </a>
      </div>
      <form onSubmit={createTenant} className="rounded bg-card p-4 shadow-md space-y-3 mt-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do tenant"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="w-48">
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="w-48">
            <select
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2"
            >
              <option value="" disabled>Selecione um plano</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!planId}
            className="rounded-md bg-[hsl(var(--action-primary-safe))] px-4 py-2 text-sm font-medium text-[hsl(var(--action-primary-foreground-safe))] hover:bg-[hsl(var(--action-primary-safe)/0.9)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar
          </button>
        </div>
        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      </form>

      {selectedTenant && (
        <div className="rounded bg-card p-4 shadow-md">
          <h2 className="text-lg font-semibold">Detalhes do tenant</h2>
          <p className="text-sm text-muted-foreground mt-1">ID: {selectedTenant.id}</p>
          <p className="text-sm text-muted-foreground">Slug: {selectedTenant.slug}</p>
          <p className="text-sm text-muted-foreground">Status: {selectedTenant.status}</p>
          <p className="text-sm text-muted-foreground">
            Onboarded: {selectedTenant.onboarded ? 'Sim' : 'Não'}
          </p>
        </div>
      )}

      <div className="rounded bg-card shadow-md">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : tenants.length === 0 ? (
          <p className="p-4 text-muted-foreground">Nenhum tenant</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-3">Nome</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{t.slug}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => updateStatus(t.id, 'active')}
                      className="rounded-md bg-success px-3 py-2 text-xs font-medium text-success-foreground hover:bg-success/90"
                    >
                      Ativar
                    </button>
                    <button
                      onClick={() => updateStatus(t.id, 'suspended')}
                      className="rounded-md bg-warning px-3 py-2 text-xs font-medium text-warning-foreground hover:bg-warning/90"
                    >
                      Suspender
                    </button>
                    <a
                      href={`/admin/tenants/${t.id}`}
                      className="rounded border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Detalhes
                    </a>
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
