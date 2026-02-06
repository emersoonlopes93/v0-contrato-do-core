'use client';

import React from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import {
  BarChart3,
  BookOpen,
  Box,
  Store,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  moduleId?: string;
  isActive?: boolean;
};

export function MobileBottomNav() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  // Função para verificar se rota está ativa
  const isRouteActive = (href?: string): boolean => {
    if (!href) return false;
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith(href);
  };

  // Itens principais do menu inferior (5 seções)
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: <BarChart3 className="h-5 w-5" />,
      href: `${basePath}/dashboard`,
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: <Box className="h-5 w-5" />,
      href: `${basePath}/orders`,
      moduleId: 'orders-module',
    },
    {
      id: 'menu',
      label: 'Cardápio',
      icon: <BookOpen className="h-5 w-5" />,
      href: `${basePath}/menu-online`,
      moduleId: 'menu-online',
    },
    {
      id: 'store',
      label: 'Loja',
      icon: <Store className="h-5 w-5" />,
      href: `${basePath}/store-settings`,
      moduleId: 'store-settings',
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <Wallet className="h-5 w-5" />,
      href: `${basePath}/financial`,
      moduleId: 'financial',
    },
  ];

  // Filtrar itens que têm módulo habilitado ou não requerem módulo
  const visibleItems = navItems.filter((item) => {
    if (!item.moduleId) return true;
    return isModuleEnabled(item.moduleId);
  });

  // Verificar estado ativo para cada item
  const itemsWithActive = visibleItems.map((item) => ({
    ...item,
    isActive: isRouteActive(item.href),
  }));

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
                    active
                      ? 'bg-primary/10 text-primary scale-110'
                      : 'text-muted-foreground'
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
