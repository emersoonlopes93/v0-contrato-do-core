'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import {
  BookOpen,
  Box,
  ChefHat,
  CreditCard,
  Headphones,
  Palette,
  ShoppingCart,
  Settings,
  Store,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { listTenantUiModules } from '@/src/modules/registry';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
};

const iconMap = {
  box: Box,
  menu: BookOpen,
  headphones: Headphones,
  store: Store,
  wallet: Wallet,
  palette: Palette,
  'chef-hat': ChefHat,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  settings: Settings,
};

const SETTINGS_MODULE_IDS = new Set<string>([
  'store-settings',
  'sound-notifications',
  'delivery-pricing',
  'designer-menu',
  'employees',
  'roles-permissions',
]);

function resolveIcon(name: string, active: boolean): React.ReactNode {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Box;
  return (
    <Icon
      className={cn(
        'h-5 w-5 transition-all duration-200',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    />
  );
}

export function MobileBottomNav() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled, hasPermission } = useSession();
  const basePath = `/tenant/${tenantSlug}`;
  const [modules, setModules] = useState<ModuleRegisterPayload[]>([]);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);

  // Função para verificar se rota está ativa
  const isRouteActive = (href?: string): boolean => {
    if (!href) return false;
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith(href);
  };

  useEffect(() => {
    listTenantUiModules()
      .then((data) => setModules(data))
      .catch(() => setModules([]));
  }, []);

  const itemsWithActive = useMemo(() => {
    const entries = modules
      .filter((module) => module.uiEntry)
      .filter((module) => !SETTINGS_MODULE_IDS.has(module.id))
      .filter((module) => isModuleEnabled(module.id))
      .filter((module) => (module.permissions.length === 0 ? true : module.permissions.some((p) => hasPermission(p.id))))
      .map((module) => {
        const entry = module.uiEntry!;
        const href = `${basePath}${entry.tenantBasePath}`;
        return {
          id: module.id,
          label: entry.homeLabel,
          icon: entry.icon,
          href,
          isActive: isRouteActive(href),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((item) => ({
        ...item,
        icon: resolveIcon(item.icon, item.isActive),
      }));
    const settingsHref = `${basePath}/settings`;
    const settingsItem: NavItem = {
      id: 'settings',
      label: 'Configurações',
      icon: resolveIcon('settings', isRouteActive(settingsHref)),
      href: settingsHref,
      isActive: isRouteActive(settingsHref),
    };
    return [...entries, settingsItem];
  }, [modules, isModuleEnabled, hasPermission, basePath]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid h-16 grid-cols-5 gap-1">
          {itemsWithActive.slice(0, 4).map((item) => {
            const active = item.isActive;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200',
                    active ? 'bg-primary/10 text-primary scale-110' : 'text-muted-foreground',
                  )}
                >
                  {item.icon}
                </div>
                <span className="truncate px-1">{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200 text-muted-foreground hover:text-foreground"
            aria-label="Mais"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="truncate px-1">Mais</span>
          </button>
        </div>
      </div>
      {isMoreOpen && (
        <div className="fixed inset-x-0 bottom-16 z-50">
          <div className="mx-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="grid grid-cols-2 gap-2">
              {itemsWithActive.slice(4).map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md">{item.icon}</div>
                  <span className="truncate">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
