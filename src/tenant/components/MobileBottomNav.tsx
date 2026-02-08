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
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;
  const [modules, setModules] = useState<ModuleRegisterPayload[]>([]);

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
      .filter((module) => isModuleEnabled(module.id))
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
      .slice(0, 5)
      .map((item) => ({
        ...item,
        icon: resolveIcon(item.icon, item.isActive),
      }));
    return entries as NavItem[];
  }, [modules, isModuleEnabled, basePath]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid h-16 max-w-lg grid-cols-5 gap-1 mx-auto">
          {itemsWithActive.map((item) => {
            const active = item.isActive;
            
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
        </div>
      </div>
    </nav>
  );
}
