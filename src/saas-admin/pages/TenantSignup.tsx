import React from 'react';
import { adminApi } from '../lib/adminApi';

interface Plan {
  id: string;
  name: string;
  modules: string[];
}

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  modules: string[];
  adminEmail: string;
}

export function AdminTenantSignupPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [modules, setModules] = React.useState<string[]>([]);

  const [tenantId, setTenantId] = React.useState<string | null>(null);
  const [tenantName, setTenantName] = React.useState('');
  const [tenantSlug, setTenantSlug] = React.useState('');
  const [initialStatus, setInitialStatus] = React.useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [planId, setPlanId] = React.useState<string>('');
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [summary, setSummary] = React.useState<TenantSummary | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get<Plan[]>('/plans');
        setPlans(data || []);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erro ao carregar planos';
        setError(message);
      }
      try {
        const data = await adminApi.get<unknown>('/modules');
        if (Array.isArray(data)) {
          const moduleIds = data
            .map((item) => {
              if (typeof item === 'string') {
                return item;
              }
              if (typeof item === 'object' && item !== null) {
                const obj = item as { id?: string; slug?: string };
                return obj.id || obj.slug || null;
              }
              return null;
            })
            .filter((value): value is string => Boolean(value));
          setModules(moduleIds);
        }
      } catch {
        setModules([]);
      }
    })();
  }, []);

  function toggleModule(moduleId: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  }

  async function handleNext() {
    setError(null);
    setLoading(true);
    try {
      if (step === 1) {
        if (!tenantName || !tenantSlug || !planId) throw new Error('Preencha nome, slug e plano');
        
        const data = await adminApi.post<{ id: string }>('/tenants', {
          name: tenantName,
          slug: tenantSlug,
          status: initialStatus, // Note: Tenant created but not onboarded yet
          planId,
        });

        setTenantId(data.id);
        // Pré-seleciona módulos permitidos pelo plano
        const plan = plans.find((p) => p.id === planId);
        setSelectedModules(plan ? plan.modules : []);
        setStep(2);
      } else if (step === 2) {
        // Apenas validação local, sem chamada de API
        if (!tenantId) throw new Error('Tenant não criado');
        setStep(3);
      } else if (step === 3) {
        if (!tenantId || !adminEmail || !adminPassword) throw new Error('Preencha usuário admin');
        setStep(4);
      } else if (step === 4) {
        if (!tenantId) throw new Error('Tenant não criado');
        
        // Filtra módulos permitidos
        const plan = plans.find((p) => p.id === planId);
        const allowed = new Set(plan ? plan.modules : []);
        const requestedModules = selectedModules.filter((m) => allowed.has(m));

        // ATOMIC ONBOARDING CALL
        await adminApi.post(`/tenants/${tenantId}/onboard`, { 
          email: adminEmail, 
          password: adminPassword,
          name: 'Admin',
          modules: requestedModules
        });
        
        // Init White Label (Opcional / Pós-Onboarding)
        try {
            await adminApi.post(`/white-label/${tenantId}/init`, {});
        } catch (e) {
            console.warn('White label init failed (ignorable):', e);
        }
        
        setSummary({
          id: tenantId,
          name: tenantName,
          slug: tenantSlug,
          status: 'active',
          modules: requestedModules,
          adminEmail,
        });
        setStep(5);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro no fluxo de onboarding';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrev() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Onboarding de Tenant (Controlado)</h1>

      {error && (
        <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>
      )}

      {/* Sidebar de progresso no desktop */}
      {!isMobile && (
        <div className="flex gap-6">
          <aside className="w-64 rounded bg-white p-4 shadow">
            <ol className="space-y-2 text-sm">
              <li className={step === 1 ? 'font-semibold text-blue-600' : ''}>1. Criar Tenant</li>
              <li className={step === 2 ? 'font-semibold text-blue-600' : ''}>2. Selecionar Módulos</li>
              <li className={step === 3 ? 'font-semibold text-blue-600' : ''}>3. Usuário Admin</li>
              <li className={step === 4 ? 'font-semibold text-blue-600' : ''}>4. Confirmar e Ativar</li>
              <li className={step === 5 ? 'font-semibold text-green-600' : ''}>5. Concluído</li>
            </ol>
          </aside>
          <main className="flex-1">
            <Wizard
              step={step}
              plans={plans}
              modules={modules}
              tenantName={tenantName}
              tenantSlug={tenantSlug}
              planId={planId}
              selectedModules={selectedModules}
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              summary={summary}
              setTenantName={setTenantName}
              setTenantSlug={setTenantSlug}
              setInitialStatus={setInitialStatus}
              setPlanId={setPlanId}
              toggleModule={toggleModule}
              setAdminEmail={setAdminEmail}
              setAdminPassword={setAdminPassword}
            />
          </main>
        </div>
      )}

      {/* Mobile: conteúdo único */}
      {isMobile && (
        <Wizard
          step={step}
          plans={plans}
          modules={modules}
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          planId={planId}
          selectedModules={selectedModules}
          adminEmail={adminEmail}
          adminPassword={adminPassword}
          summary={summary}
          setTenantName={setTenantName}
          setTenantSlug={setTenantSlug}
          setInitialStatus={setInitialStatus}
          setPlanId={setPlanId}
          toggleModule={toggleModule}
          setAdminEmail={setAdminEmail}
          setAdminPassword={setAdminPassword}
        />
      )}

      <div className="flex gap-2">
        {step > 1 && step < 5 && (
          <button
            onClick={handlePrev}
            className="rounded border px-4 py-3 hover:bg-gray-100"
            style={{ minHeight: 44 }}
            disabled={loading}
          >
            Voltar
          </button>
        )}
        {step < 5 && (
          <button
            onClick={handleNext}
            className={`rounded px-4 py-3 text-white ${step === 4 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            style={{ minHeight: 44 }}
            disabled={loading}
          >
            {loading ? 'Processando...' : step === 4 ? 'Confirmar e Ativar' : 'Continuar'}
          </button>
        )}
        {step === 5 && (
          <a
            href="/admin/tenants"
            className="rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700"
            style={{ minHeight: 44 }}
          >
            Voltar para Lista
          </a>
        )}
      </div>
    </div>
  );
}

function Wizard(props: {
  step: number;
  plans: Plan[];
  modules: string[];
  tenantName: string;
  tenantSlug: string;
  planId: string;
  selectedModules: string[];
  adminEmail: string;
  adminPassword: string;
  summary: TenantSummary | null;
  setTenantName: (v: string) => void;
  setTenantSlug: (v: string) => void;
  setInitialStatus: React.Dispatch<React.SetStateAction<'ACTIVE' | 'PENDING'>>;
  setPlanId: (v: string) => void;
  toggleModule: (id: string) => void;
  setAdminEmail: (v: string) => void;
  setAdminPassword: (v: string) => void;
}) {
  const {
    step,
    plans,
    modules,
    tenantName,
    tenantSlug,
    planId,
    selectedModules,
    adminEmail,
    adminPassword,
    summary,
    setTenantName,
    setTenantSlug,
    setPlanId,
    toggleModule,
    setAdminEmail,
    setAdminPassword,
  } = props;

  if (step === 1) {
    return (
      <div className="rounded bg-white p-4 shadow space-y-3">
        <h2 className="text-lg font-semibold">1. Informações do Tenant</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Nome</label>
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Ex: Minha Empresa"
            className="w-full rounded border px-3 py-2"
          />
          <label className="block text-sm font-medium">Slug (URL)</label>
          <input
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="ex: minha-empresa"
            className="w-full rounded border px-3 py-2"
          />
          <label className="block text-sm font-medium">Plano Inicial</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">Selecione um plano</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="rounded bg-white p-4 shadow space-y-3">
        <h2 className="text-lg font-semibold">2. Seleção de Módulos</h2>
        <p className="text-sm text-muted-foreground">
          Marque os módulos que serão ativados neste tenant.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {modules.map((m) => (
            <label key={m} className="flex items-center gap-2 rounded border p-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedModules.includes(m)}
                onChange={() => toggleModule(m)}
              />
              {m}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="rounded bg-white p-4 shadow space-y-3">
        <h2 className="text-lg font-semibold">3. Usuário Administrador</h2>
        <p className="text-sm text-muted-foreground">
          Defina as credenciais do primeiro usuário (Owner).
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@empresa.com"
            className="w-full rounded border px-3 py-2"
          />
          <label className="block text-sm font-medium">Senha</label>
          <input
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Senha forte"
            type="password"
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>
    );
  }

  if (step === 4) {
    const planName = plans.find((p) => p.id === planId)?.name || planId;
    return (
        <div className="rounded bg-white p-4 shadow space-y-3">
          <h2 className="text-lg font-semibold">4. Revisão e Ativação</h2>
          <div className="space-y-2 text-sm border p-4 rounded bg-gray-50">
            <p><strong>Tenant:</strong> {tenantName} ({tenantSlug})</p>
            <p><strong>Plano:</strong> {planName}</p>
            <p><strong>Módulos Selecionados:</strong> {selectedModules.join(', ') || 'Nenhum'}</p>
            <p><strong>Admin:</strong> {adminEmail}</p>
          </div>
          <p className="text-sm text-yellow-600 mt-2">
            Ao confirmar, o sistema irá criar o usuário, ativar os módulos e liberar o acesso (Onboarding).
          </p>
        </div>
      );
  }

  return (
    <div className="rounded bg-white p-4 shadow space-y-3">
      <h2 className="text-lg font-semibold text-green-600">5. Onboarding Concluído!</h2>
      {!summary ? (
        <p>Carregando resumo...</p>
      ) : (
        <div className="space-y-2 text-sm">
          <p>O tenant <strong>{summary.name}</strong> foi ativado com sucesso.</p>
          <p>O usuário <strong>{summary.adminEmail}</strong> já pode fazer login.</p>
        </div>
      )}
    </div>
  );
}
