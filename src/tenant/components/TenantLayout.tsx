'use client';

import React, { useState } from "react"
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSession } from '../context/SessionContext';
import { Home, User, MessageCircle, Menu, LogOut, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import { PlanUsageIndicator } from './PlanUsageIndicator';

/**
 * Tenant Layout - Mobile First
 * 
 * - Mobile: Bottom navigation
 * - Tablet/Desktop: Collapsible sidebar
 * - Capacitor-ready (no browser-only APIs)
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  moduleId?: string;
}

export function TenantLayout({ children }: { children: React.ReactNode }) {
  const { user, isModuleEnabled, logout } = useSession();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Base navigation - sempre disponível
  const navItems: NavItem[] = [
    { label: 'Home', href: '/tenant', icon: <Home className="h-5 w-5" /> },
    { label: 'Perfil', href: '/tenant/profile', icon: <User className="h-5 w-5" /> },
  ];

  // Module-specific navigation (runtime, from API)
  if (isModuleEnabled('hello-module')) {
    navItems.push({
      label: 'Hello',
      href: '/tenant/hello',
      icon: <MessageCircle className="h-5 w-5" />,
      moduleId: 'hello-module',
    });
  }

  if (isModuleEnabled('menu-online')) {
    navItems.push({
      label: 'Cardápio',
      href: '/tenant/menu-online',
      icon: <BookOpen className="h-5 w-5" />,
      moduleId: 'menu-online',
    });
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header - Mobile */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 flex flex-col">
             <div className="flex h-14 items-center border-b px-4 mb-4">
                 {theme.logo ? (
                     <img src={theme.logo} alt="Logo" className="h-8 max-w-full object-contain" />
                 ) : (
                     <span className="font-bold">Tenant App</span>
                 )}
            </div>
            <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </nav>
            
            <div className="border-t pt-4">
               <PlanUsageIndicator />
            </div>

            <div className="mt-2 border-t pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </Button>
            </div>
          </SheetContent>
        </Sheet>
        
         {/* Mobile Header Logo */}
        <div className="flex items-center">
             {theme.logo ? (
                 <img src={theme.logo} alt="Logo" className="h-8 max-w-[150px] object-contain" />
             ) : (
                 <span className="font-bold text-lg">Tenant App</span>
             )}
        </div>
        <div className="w-9" /> {/* Spacer for alignment */}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-background md:flex md:flex-col">
            <div className="flex h-14 items-center border-b px-4">
                {theme.logo ? (
                    <img src={theme.logo} alt="Logo" className="h-8 max-w-full object-contain" />
                ) : (
                    <h2 className="text-sm font-semibold truncate">{user?.email}</h2>
                )}
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
            {navItems.map((item) => (
                <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                {item.icon}
                {item.label}
                </a>
            ))}
            </nav>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => logout()}
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </Button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}
