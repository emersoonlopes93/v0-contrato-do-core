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
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          {item.icon}
          {item.label}
        </a>
      ))}
    </nav>
  );
}
