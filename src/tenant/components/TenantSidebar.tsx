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
  ChevronRight,
} from 'lucide-react';
import type { ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { listTenantUiModules } from '@/src/modules/registry';

type SidebarItem = {
  label: string;
  href: string;
  isActive?: boolean;
  disabled?: boolean;
};

type SidebarSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
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

function resolveIcon(name: string): React.ReactNode {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Box;
  return <Icon className="h-4 w-4" />;
}

function isRouteActive(href?: string): boolean {
  if (!href) return false;
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(href);
}

export function TenantSidebar() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled, hasPermission } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [modules, setModules] = useState<ModuleRegisterPayload[]>([]);

  useEffect(() => {
    listTenantUiModules()
      .then((data) => setModules(data))
      .catch(() => setModules([]));
  }, []);

  const sections: SidebarSection[] = useMemo(() => {
    const grouped = new Map<string, { label: string; iconName: string; items: SidebarItem[] }>();
    modules.forEach((module) => {
      const entry = module.uiEntry;
      if (!entry) return;
      if (!isModuleEnabled(module.id)) return;

      const hasAnyPermission = module.permissions.some((p) => hasPermission(p.id));
      if (!hasAnyPermission) return;
      const category = entry.category || 'Módulos';
      if (!grouped.has(category)) {
        grouped.set(category, { label: category, iconName: entry.icon || 'box', items: [] });
      }
      const href = `${basePath}${entry.tenantBasePath}`;
      const section = grouped.get(category);
      if (!section) return;
      section.items.push({
        label: entry.homeLabel,
        href,
        isActive: isRouteActive(href),
        disabled: false,
      });
    });
    return Array.from(grouped.values()).map((section, index) => ({
      id: `${section.label}-${index}`,
      label: section.label,
      icon: resolveIcon(section.iconName),
      items: section.items.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [modules, basePath, isModuleEnabled, hasPermission]);

  const visibleSections = sections.filter((section) => section.items.length > 0);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <nav className="space-y-1 text-sm">
      {visibleSections.map((section) => {
        const hasActiveItem = section.items.some((item) => item.isActive);
        const isOpen = openSections[section.id] ?? hasActiveItem;
        const iconClasses = 'bg-muted text-muted-foreground';
        const containerClasses =
          hasActiveItem
            ? 'rounded-lg transition-colors'
            : 'rounded-lg border border-transparent hover:border-border-soft transition-colors';
        return (
          <div key={section.id} className={containerClasses}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full min-h-12 items-center justify-between px-3 text-left font-semibold text-foreground hover:bg-muted/40 active:scale-[0.98] transition-colors duration-150"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold ${iconClasses}`}
                >
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </span>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="min-h-0 space-y-1 pb-2">
                {section.items.map((item) => {
                  const isActive = item.isActive === true;
                  const commonClasses =
                    'flex min-h-12 items-center gap-3 rounded-md px-4 text-sm transition-colors';

                  if (item.disabled) {
                    return (
                      <div
                        key={item.href}
                        className={`${commonClasses} text-muted-foreground opacity-60`}
                      >
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                        <span>{item.label}</span>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={
                        isActive
                          ? `${commonClasses} text-primary font-semibold`
                          : `${commonClasses} text-muted-foreground hover:bg-accent hover:text-accent-foreground`
                      }
                    >
                      <span
                        className={
                          isActive
                            ? 'h-2 w-2 rounded-full bg-primary'
                            : 'h-2 w-2 rounded-full bg-muted-foreground/40'
                        }
                      />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
