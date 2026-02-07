import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Settings, Palette, ShieldCheck, Package, Sliders, Info, Plus, Trash2 } from 'lucide-react';
import type { SaaSAdminGlobalSettingsDTO } from '@/src/types/saas-admin';

const STORAGE_KEY = 'saas_admin_global_settings';

const defaultSettings: SaaSAdminGlobalSettingsDTO = {
  defaultTheme: 'light',
  defaultModules: [],
  flags: {
    checkoutEnabled: true,
    onboardingRequired: true,
    maintenanceMode: false,
  },
  limits: {
    maxUsersPerTenant: null,
    maxOrdersPerMonth: null,
    maxLocations: null,
  },
  applyToExisting: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSettings(): SaaSAdminGlobalSettingsDTO {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultSettings;
    const candidate = parsed as SaaSAdminGlobalSettingsDTO;
    return {
      ...defaultSettings,
      ...candidate,
      flags: { ...defaultSettings.flags, ...(candidate.flags ?? {}) },
      limits: { ...defaultSettings.limits, ...(candidate.limits ?? {}) },
      defaultModules: Array.isArray(candidate.defaultModules)
        ? candidate.defaultModules.filter((item) => typeof item === 'string')
        : [],
      applyToExisting: false,
    };
  } catch {
    return defaultSettings;
  }
}

export function AdminGlobalSettingsPage() {
  const [settings, setSettings] = React.useState<SaaSAdminGlobalSettingsDTO>(() => readSettings());
  const [moduleInput, setModuleInput] = React.useState('');

  const updateFlags = (key: keyof SaaSAdminGlobalSettingsDTO['flags'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      flags: { ...prev.flags, [key]: value },
    }));
  };

  const updateLimit = (key: keyof SaaSAdminGlobalSettingsDTO['limits'], value: string) => {
    if (value === '') {
      setSettings((prev) => ({
        ...prev,
        limits: { ...prev.limits, [key]: null },
      }));
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setSettings((prev) => ({
      ...prev,
      limits: { ...prev.limits, [key]: parsed },
    }));
  };

  const addModule = () => {
    const normalized = moduleInput.trim();
    if (!normalized) {
      toast({ title: 'Informe um módulo', description: 'Digite o slug do módulo padrão' });
      return;
    }
    if (settings.defaultModules.includes(normalized)) {
      toast({ title: 'Módulo já existe', description: normalized });
      return;
    }
    setSettings((prev) => ({
      ...prev,
      defaultModules: [...prev.defaultModules, normalized],
    }));
    setModuleInput('');
  };

  const removeModule = (moduleId: string) => {
    setSettings((prev) => ({
      ...prev,
      defaultModules: prev.defaultModules.filter((item) => item !== moduleId),
    }));
  };

  const saveSettings = () => {
    const payload: SaaSAdminGlobalSettingsDTO = {
      ...settings,
      applyToExisting: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    toast({ title: 'Configurações salvas', description: 'Aplicadas para novos tenants' });
  };

  const resetDefaults = () => {
    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    toast({ title: 'Padrões restaurados', description: 'Configurações globais reiniciadas' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          Configurações Globais do SaaS
        </h1>
        <p className="text-muted-foreground mt-1">
          Defina padrões e limites que serão aplicados apenas em novos tenants
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema padrão
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3 cursor-pointer">
              <input
                type="radio"
                name="defaultTheme"
                value="light"
                checked={settings.defaultTheme === 'light'}
                onChange={() => setSettings((prev) => ({ ...prev, defaultTheme: 'light' }))}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-foreground">Light</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3 cursor-pointer">
              <input
                type="radio"
                name="defaultTheme"
                value="dark"
                checked={settings.defaultTheme === 'dark'}
                onChange={() => setSettings((prev) => ({ ...prev, defaultTheme: 'dark' }))}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-foreground">Dark</span>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5" />
            Módulos padrão
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={moduleInput}
              onChange={(e) => setModuleInput(e.target.value)}
              placeholder="slug-do-modulo"
              className="flex-1 rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
          {settings.defaultModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum módulo padrão definido</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.defaultModules.map((moduleId) => (
                <span
                  key={moduleId}
                  className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted px-3 py-1 text-xs text-foreground"
                >
                  {moduleId}
                  <button
                    type="button"
                    onClick={() => removeModule(moduleId)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Flags globais
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Checkout habilitado</p>
              <p className="text-xs text-muted-foreground">Padrão para novos tenants</p>
            </div>
            <Switch
              checked={settings.flags.checkoutEnabled}
              onCheckedChange={(value) => updateFlags('checkoutEnabled', value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Onboarding obrigatório</p>
              <p className="text-xs text-muted-foreground">Fluxo inicial ativo</p>
            </div>
            <Switch
              checked={settings.flags.onboardingRequired}
              onCheckedChange={(value) => updateFlags('onboardingRequired', value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Manutenção</p>
              <p className="text-xs text-muted-foreground">Bloqueia novos tenants</p>
            </div>
            <Switch
              checked={settings.flags.maintenanceMode}
              onCheckedChange={(value) => updateFlags('maintenanceMode', value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Limites globais
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Usuários por tenant</label>
            <input
              type="number"
              min={0}
              value={settings.limits.maxUsersPerTenant ?? ''}
              onChange={(e) => updateLimit('maxUsersPerTenant', e.target.value)}
              placeholder="Sem limite"
              className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pedidos por mês</label>
            <input
              type="number"
              min={0}
              value={settings.limits.maxOrdersPerMonth ?? ''}
              onChange={(e) => updateLimit('maxOrdersPerMonth', e.target.value)}
              placeholder="Sem limite"
              className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Unidades por tenant</label>
            <input
              type="number"
              min={0}
              value={settings.limits.maxLocations ?? ''}
              onChange={(e) => updateLimit('maxLocations', e.target.value)}
              placeholder="Sem limite"
              className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Info className="h-5 w-5" />
            Escopo das mudanças
          </h2>
        </div>
        <div className="p-6">
          <div className="rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
            Essas configurações são aplicadas apenas a novos tenants para garantir estabilidade do core.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveSettings}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200"
        >
          Salvar configurações
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="rounded-xl border border-border/40 px-6 py-3 text-sm font-medium hover:bg-accent transition-colors duration-200"
        >
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
