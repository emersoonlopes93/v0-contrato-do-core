'use client';

import React, { useState } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import {
  BarChart3,
  BookOpen,
  Box,
  Headphones,
  MessageCircle,
  MousePointer2,
  Store,
  Truck,
  Wallet,
  ChevronRight,
} from 'lucide-react';

type SidebarSectionId =
  | 'reports'
  | 'orders'
  | 'sounds'
  | 'menu'
  | 'delivery'
  | 'support'
  | 'store'
  | 'integrations'
  | 'finance';

type SidebarItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
};

type SidebarSection = {
  id: SidebarSectionId;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
};

const sidebarSectionIconColors: Record<SidebarSectionId, string> = {
  reports: 'bg-amber-500/10 text-amber-500',
  orders: 'bg-primary/10 text-primary',
  sounds: 'bg-indigo-500/10 text-indigo-500',
  menu: 'bg-rose-500/10 text-rose-500',
  delivery: 'bg-sky-500/10 text-sky-500',
  support: 'bg-emerald-500/10 text-emerald-500',
  store: 'bg-teal-500/10 text-teal-500',
  integrations: 'bg-cyan-500/10 text-cyan-500',
  finance: 'bg-violet-500/10 text-violet-500',
};

function isRouteActive(href?: string): boolean {
  if (!href) return false;
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(href);
}

export function TenantSidebar() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  const [openSections, setOpenSections] = useState<Partial<Record<SidebarSectionId, boolean>>>({});

  const sections: SidebarSection[] = [
    {
      id: 'reports',
      label: 'Relatórios',
      icon: <BarChart3 className="h-4 w-4" />,
      items: [
        {
          label: 'Visão Geral',
          href: `${basePath}/dashboard`,
          isActive: isRouteActive(`${basePath}/dashboard`),
        },
        {
          label: 'Financeiro',
          href: isModuleEnabled('financial') ? `${basePath}/financial` : undefined,
          disabled: !isModuleEnabled('financial'),
          isActive: isRouteActive(`${basePath}/financial`),
        },
        {
          label: 'Performance',
          href: undefined,
          disabled: true,
        },
      ],
    },
    {
      id: 'orders',
      label: 'Gestor de Pedidos',
      icon: <Box className="h-4 w-4" />,
      items: [
        {
          label: 'Kanban',
          href: isModuleEnabled('orders-module') ? `${basePath}/orders/kanban` : undefined,
          disabled: !isModuleEnabled('orders-module'),
          isActive: isRouteActive(`${basePath}/orders/kanban`),
        },
        {
          label: 'Lista',
          href: isModuleEnabled('orders-module') ? `${basePath}/orders` : undefined,
          disabled: !isModuleEnabled('orders-module'),
          isActive: isRouteActive(`${basePath}/orders`),
        },
        {
          label: 'Histórico',
          href: undefined,
          disabled: true,
        },
      ],
    },
    {
      id: 'sounds',
      label: 'Sons',
      icon: <Headphones className="h-4 w-4" />,
      items: [
        {
          label: 'Notificações',
          href: isModuleEnabled('sound-notifications')
            ? `${basePath}/sound-notifications/settings`
            : undefined,
          disabled: !isModuleEnabled('sound-notifications'),
          isActive: isRouteActive(`${basePath}/sound-notifications`),
        },
        {
          label: 'Alertas',
          href: undefined,
          disabled: true,
        },
      ],
    },
    {
      id: 'menu',
      label: 'Cardápio',
      icon: <BookOpen className="h-4 w-4" />,
      items: [
        {
          label: 'Dashboard',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online`) && !isRouteActive(`${basePath}/menu-online/`),
        },
        {
          label: 'Produtos',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/products` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/products`),
        },
        {
          label: 'Promoções',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/promotions` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/promotions`),
        },
        {
          label: 'Fidelidade & Cashback',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/rewards` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/rewards`),
        },
        {
          label: 'Preview',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/preview` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/preview`),
        },
        {
          label: 'Designer do Cardápio',
          href: isModuleEnabled('designer-menu') ? `${basePath}/designer-menu` : undefined,
          disabled: !isModuleEnabled('designer-menu'),
          isActive: isRouteActive(`${basePath}/designer-menu`),
        },
      ],
    },
    {
      id: 'delivery',
      label: 'Entregas',
      icon: <Truck className="h-4 w-4" />,
      items: [
        { label: 'Motoboys', href: undefined, disabled: true },
        { label: 'Rotas', href: undefined, disabled: true },
        { label: 'Rastreamento', href: undefined, disabled: true },
      ],
    },
    {
      id: 'support',
      label: 'Atendimento',
      icon: <MessageCircle className="h-4 w-4" />,
      items: [
        { label: 'WhatsApp', href: undefined, disabled: true },
        { label: 'Chat', href: undefined, disabled: true },
      ],
    },
    {
      id: 'store',
      label: 'Configurações da Loja',
      icon: <Store className="h-4 w-4" />,
      items: [
        {
          label: 'Dados da Loja',
          href: isModuleEnabled('store-settings') ? `${basePath}/store-settings` : undefined,
          disabled: !isModuleEnabled('store-settings'),
          isActive: isRouteActive(`${basePath}/store-settings`),
        },
        { label: 'Horários', href: undefined, disabled: true },
        { label: 'Área de Entrega', href: undefined, disabled: true },
      ],
    },
    {
      id: 'integrations',
      label: 'Integrações',
      icon: <MousePointer2 className="h-4 w-4" />,
      items: [
        {
          label: 'Pagamentos',
          href: isModuleEnabled('payments') ? `${basePath}/payments` : undefined,
          disabled: !isModuleEnabled('payments'),
          isActive: isRouteActive(`${basePath}/payments`),
        },
        { label: 'Webhooks', href: undefined, disabled: true },
        { label: 'WhatsApp API', href: undefined, disabled: true },
      ],
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <Wallet className="h-4 w-4" />,
      items: [
        { label: 'Caixa', href: undefined, disabled: true },
        { label: 'Recebíveis', href: undefined, disabled: true },
        { label: 'Taxas', href: undefined, disabled: true },
      ],
    },
  ];

  const visibleSections = sections.filter((section) =>
    section.items.some((item) => item.href && !item.disabled),
  );

  const toggleSection = (id: SidebarSectionId) => {
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
        const iconClasses =
          sidebarSectionIconColors[section.id] ?? 'bg-muted text-muted-foreground';
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

                  if (!item.href || item.disabled) {
                    return null;
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
