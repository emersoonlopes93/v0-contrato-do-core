'use client';

import React from 'react';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Home, User, MessageCircle, BookOpen, ShoppingCart, BellRing, Settings, CreditCard } from 'lucide-react';

/**
 * TenantSidebar - Menu de Navegação
 * 
 * Responsável apenas pelo menu de módulos do sistema.
 * Não inclui branding (isso fica no Header).
 */

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  moduleId?: string;
};

export function TenantSidebar() {
  const { tenantSlug } = useTenant();
  const { isModuleEnabled } = useSession();
  const basePath = `/tenant/${tenantSlug}`;

  // Base navigation - sempre disponível
  const navItems: NavItem[] = [
    { label: 'Home', href: `${basePath}/dashboard`, icon: <Home className="h-5 w-5" /> },
    { label: 'Perfil', href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
  ];

  // Module-specific navigation
  if (isModuleEnabled('hello-module')) {
    navItems.push({
      label: 'Hello',
      href: `${basePath}/hello`,
      icon: <MessageCircle className="h-5 w-5" />,
      moduleId: 'hello-module',
    });
  }

  if (isModuleEnabled('menu-online')) {
    navItems.push({
      label: 'Cardápio',
      href: `${basePath}/menu-online`,
      icon: <BookOpen className="h-5 w-5" />,
      moduleId: 'menu-online',
    });
  }

  if (isModuleEnabled('orders-module')) {
    navItems.push({
      label: 'Pedidos',
      href: `${basePath}/orders`,
      icon: <ShoppingCart className="h-5 w-5" />,
      moduleId: 'orders-module',
    });
  }

  if (isModuleEnabled('sound-notifications')) {
    navItems.push({
      label: 'Sons',
      href: `${basePath}/sound-notifications/settings`,
      icon: <BellRing className="h-5 w-5" />,
      moduleId: 'sound-notifications',
    });
  }

  if (isModuleEnabled('settings')) {
    navItems.push({
      label: 'Configurações',
      href: `${basePath}/settings`,
      icon: <Settings className="h-5 w-5" />,
      moduleId: 'settings',
    });
  }

  if (isModuleEnabled('checkout')) {
    navItems.push({
      label: 'Checkout',
      href: `${basePath}/checkout`,
      icon: <CreditCard className="h-5 w-5" />,
      moduleId: 'checkout',
    });
  }

  if (isModuleEnabled('financial')) {
    navItems.push({
      label: 'Financeiro',
      href: `${basePath}/financial`,
      icon: <CreditCard className="h-5 w-5" />,
      moduleId: 'financial',
    });
  }

  return (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        // Verifica se é a rota ativa
        const isActive = typeof window !== 'undefined' && window.location.pathname.includes(item.href);
        
        return (
          <a
            key={item.href}
            href={item.href}
            className={`
              group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
              transition-all duration-200 ease-in-out
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
              }
            `}
          >
            <span className={`
              transition-transform duration-200 ease-in-out
              ${isActive ? 'scale-110' : 'group-hover:scale-110'}
            `}>
              {item.icon}
            </span>
            <span className="leading-none">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
