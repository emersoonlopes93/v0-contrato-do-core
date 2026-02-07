'use client';

import React from 'react';
import { useTenant } from '@/src/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useMenuUxMode } from '../../hooks/useMenuUxMode';
import './menu-ifood-styles.css';

interface MenuIfoodHeaderProps {
  stats?: {
    categories: number;
    products: number;
    complements: number;
  };
  activeTab: 'overview' | 'products' | 'complements';
  onTabChange: (tab: 'overview' | 'products' | 'complements') => void;
}

export function MenuIfoodHeader({ stats, activeTab, onTabChange }: MenuIfoodHeaderProps) {
  const { tenantSlug } = useTenant();
  const { setMode, isIfoodMode } = useMenuUxMode();

  const tabs = [
    { id: 'overview' as const, label: 'Visão geral', count: stats?.categories ?? 0 },
    { id: 'products' as const, label: 'Produtos', count: stats?.products ?? 0 },
    { id: 'complements' as const, label: 'Complementos', count: stats?.complements ?? 0 },
  ];

  const handleToggleUxMode = (checked: boolean) => {
    setMode(checked ? 'ifood' : 'classic');
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b menu-ifood-transition">
      <div className="space-y-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3 md:justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="min-w-0 flex-1 text-center text-xl font-bold">Cardápio</h1>

          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex gap-2 menu-ifood-transition hover:bg-primary hover:text-primary-foreground shrink-0"
            asChild
          >
            <a href={`/tenant/${tenantSlug}/menu-online/settings`}>
              <Settings className="h-4 w-4" />
              Configurações
            </a>
          </Button>
        </div>

        <div className="w-full min-h-[44px] rounded-xl border bg-muted/40 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">iFood</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={isIfoodMode}
              onCheckedChange={handleToggleUxMode}
              aria-label="Modo UX iFood"
              className="menu-ifood-transition shrink-0 h-6 w-11"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-1 menu-ifood-category-bar">
          <nav className="flex min-w-max gap-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                data-state={activeTab === tab.id ? 'active' : 'inactive'}
                className={`
                  relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap
                  menu-ifood-transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring menu-ifood-focus
                  disabled:pointer-events-none disabled:opacity-50
                  ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
