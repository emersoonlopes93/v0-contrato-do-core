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

function isRouteActive(href?: string): boolean {
  if (!href) return false;
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(href);
}

export function TenantSidebar() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  const [openSections, setOpenSections] = useState<Record<SidebarSectionId, boolean>>({
    reports: false,
    orders: false,
    sounds: false,
    menu: false,
    delivery: false,
    support: false,
    store: false,
    integrations: false,
    finance: false,
  });

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
          label: 'Categorias',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/categories` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/categories`),
        },
        {
          label: 'Produtos',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/products` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/products`),
        },
        {
          label: 'Complementos',
          href: isModuleEnabled('menu-online') ? `${basePath}/menu-online/modifiers` : undefined,
          disabled: !isModuleEnabled('menu-online'),
          isActive: isRouteActive(`${basePath}/menu-online/modifiers`),
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
      label: 'Administrar Loja',
      icon: <Store className="h-4 w-4" />,
      items: [
        {
          label: 'Dados da Loja',
          href: `${basePath}/settings`,
          isActive: isRouteActive(`${basePath}/settings`),
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

  const toggleSection = (id: SidebarSectionId) => {
    setOpenSections((prev) => {
      const next: Record<SidebarSectionId, boolean> = { ...prev };
      (Object.keys(next) as SidebarSectionId[]).forEach((key) => {
        next[key] = key === id ? !prev[id] : false;
      });
      return next;
    });
  };

  return (
    <nav className="space-y-1 text-sm">
      {sections.map((section) => {
        const isOpen = openSections[section.id];
        return (
          <div key={section.id} className="rounded-lg border border-transparent hover:border-border-soft transition-colors">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full min-h-12 items-center justify-between px-3 text-left font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
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
                          ? `${commonClasses} bg-primary-soft text-primary border border-border-soft`
                          : `${commonClasses} text-muted-foreground hover:bg-accent hover:text-accent-foreground`
                      }
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
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
