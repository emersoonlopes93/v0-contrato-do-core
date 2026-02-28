'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import {
  Box,
  ChefHat,
  Link2,
  Wallet,
  Folder,
  Truck,
  Briefcase,
  Package,
  ShoppingCart,
  Settings,
  Users,
} from 'lucide-react';
import type { ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { listTenantUiModules } from '@/src/modules/registry';
import { cn } from '@/lib/utils';
import type { NavigationCategory, NavigationMode } from '@/src/tenant/navigation/navigation-taxonomy';

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  priority: number;
};

type SidebarCategory = {
  id: NavigationCategory;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  minPriority: number;
};

const CATEGORY_LABELS: Record<NavigationCategory, string> = {
  dashboard: 'Dashboard',
  operacao: 'Operação',
  cardapio: 'Cardápio',
  entregas: 'Entregas',
  financeiro: 'Financeiro',
  clientes: 'Clientes',
  pessoas: 'Pessoas',
  integracoes: 'Integrações',
  configuracoes: 'Configurações',
  experiencia: 'Experiência',
};

function isRouteActive(href?: string) {
  if (!href) return false;
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(href);
}

function resolveCategoryIcon(category: NavigationCategory) {
  switch (category) {
    case 'dashboard':
      return <Box className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'operacao':
      return <Folder className="h-4 w-4 text-orange-500 shrink-0" />;
    case 'cardapio':
      return <ChefHat className="h-4 w-4 text-orange-500 shrink-0" />;
    case 'entregas':
      return <Truck className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'financeiro':
      return <Wallet className="h-4 w-4 text-green-500 shrink-0" />;
    case 'clientes':
      return <Briefcase className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'pessoas':
      return <Users className="h-4 w-4 text-indigo-500 shrink-0" />;
    case 'integracoes':
      return <Link2 className="h-4 w-4 text-purple-500 shrink-0" />;
    case 'configuracoes':
      return <Settings className="h-4 w-4 text-slate-500 shrink-0" />;
    case 'experiencia':
      return <Package className="h-4 w-4 text-pink-500 shrink-0" />;
    default:
      return <Settings className="h-4 w-4 text-gray-400 shrink-0" />;
  }
}

function resolveItemIcon(label: string) {
  switch (label.toLowerCase()) {
    case 'pdv':
      return <ShoppingCart className="h-4 w-4 text-indigo-500 shrink-0" />;
    default:
      return <Box className="h-4 w-4 text-slate-400 shrink-0" />;
  }
}

export function TenantSidebar() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled, hasPermission } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  const [modules, setModules] = useState<ModuleRegisterPayload[]>([]);
  const [mode, setMode] = useState<NavigationMode>('essential');

  useEffect(() => {
    listTenantUiModules()
      .then(setModules)
      .catch(() => setModules([]));
  }, []);

  const categories: SidebarCategory[] = useMemo(() => {
    const map = new Map<NavigationCategory, { items: SidebarItem[]; minPriority: number }>();

    modules.forEach((module) => {
      const entry = module.uiEntry;
      const navigation = module.navigation;
      if (!entry) return;
      if (!navigation) return;
      if (!isModuleEnabled(module.id)) return;
      if (!navigation.modes.includes(mode)) return;
      if (mode === 'essential' && navigation.isAdvanced) return;

      const hasAnyPermission = module.permissions.some((p) =>
        hasPermission(p.id)
      );
      if (!hasAnyPermission) return;

      const href = `${basePath}${entry.tenantBasePath}`;
      const category = navigation.category;
      const item: SidebarItem = {
        label: entry.homeLabel,
        href,
        icon: resolveItemIcon(entry.homeLabel),
        isActive: isRouteActive(href),
        priority: navigation.priority,
      };

      const existing = map.get(category);
      if (!existing) {
        map.set(category, { items: [item], minPriority: navigation.priority });
        return;
      }

      existing.items.push(item);
      if (navigation.priority < existing.minPriority) {
        existing.minPriority = navigation.priority;
      }
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({
        id: category,
        label: CATEGORY_LABELS[category],
        icon: resolveCategoryIcon(category),
        items: data.items.sort((a, b) => a.priority - b.priority),
        minPriority: data.minPriority,
      }))
      .sort((a, b) => a.minPriority - b.minPriority);
  }, [modules, basePath, isModuleEnabled, hasPermission, mode]);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">

      {/* Header */}
      <div className="px-5 py-4 border-b">
        <h2 className="text-sm font-semibold text-slate-700">
          Painel Admin
        </h2>
      </div>

      <div className="px-4 py-3 border-b">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('essential')}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              mode === 'essential'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            )}
          >
            Essencial
          </button>
          <button
            type="button"
            onClick={() => setMode('professional')}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              mode === 'professional'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            )}
          >
            Profissional
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-4 space-y-3 border-b">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-100 text-green-700 text-xs font-medium py-2">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          Loja aberta
        </div>

        <button className="w-full rounded-lg border text-xs py-2 font-medium text-slate-600 hover:bg-slate-50 transition">
          VER CARDÁPIO
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">

        {categories.map((category) => {
          const hasActiveItem = category.items.some((i) => i.isActive);

          return (
            <div key={category.id}>
              {/* Categoria */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                  hasActiveItem
                    ? "bg-slate-100 font-medium text-slate-800"
                    : "text-slate-700"
                )}
              >
                {category.icon}
                <span>{category.label}</span>
              </div>

              {/* Subitens */}
              <div className="ml-9 mt-1 space-y-1">
                {category.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition",
                      item.isActive
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          );
        })}

      </div>
      
    </aside>
  );
}
