'use client';

import React from "react"

import { Menu, Home, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTenantAuth } from '../hooks/use-tenant-auth';
import { useState } from 'react';

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
  const { token, logout } = useTenantAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Base navigation - sempre disponível
  const navItems: NavItem[] = [
    { label: 'Home', href: '/tenant', icon: <Home className="h-5 w-5" /> },
    { label: 'Perfil', href: '/tenant/profile', icon: <User className="h-5 w-5" /> },
  ];

  // TODO: Add module-specific nav items based on token.activeModules
  // Example:
  // if (token?.activeModules?.includes('hello-module')) {
  //   navItems.push({ label: 'Hello', href: '/tenant/hello', icon: <MessageCircle /> });
  // }

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
          <SheetContent side="left" className="w-64">
            <nav className="flex flex-col gap-2 pt-4">
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
              <Button
                variant="ghost"
                className="justify-start gap-3"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-sm font-semibold">{token?.email}</h1>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background md:block">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-sm font-semibold">{token?.email}</h2>
        </div>
        <nav className="flex flex-col gap-1 p-4">
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
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="container max-w-6xl p-4 pb-20 md:pb-4">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.slice(0, 4).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex min-w-[44px] flex-col items-center gap-1 py-2"
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
