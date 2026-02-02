'use client';

import React, { useState } from "react"
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { TenantHeader } from './TenantHeader';
import { TenantSidebar } from './TenantSidebar';
import { TenantFooter } from './TenantFooter';
import { DesktopHeader } from './DesktopHeader';
import { PlanUsageIndicator } from './PlanUsageIndicator';

/**
 * Tenant Layout - Layout Base Premium
 * 
 * HIERARQUIA (de cima para baixo):
 * 1. Nome do SaaS
 * 2. Logo ou Nome do Restaurante (Tenant)
 * 3. Status da Loja: Aberta | Fechada
 * 4. Link: Ver Cardápio Público
 * ────────────────────────
 * 5. Menu do Sistema (módulos)
 * ────────────────────────
 * 6. Rodapé: Nome do usuário + Cargo (RBAC)
 * 
 * PREMIUM:
 * - Mobile-first com drawer elegante
 * - Desktop com sidebar fixa e header
 * - Transições suaves (150-200ms)
 * - Visual profissional e vendável
 */

type TenantLayoutProps = {
  children: React.ReactNode;
  pageTitle?: string;
  headerActions?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
};

export function TenantLayout({ 
  children, 
  pageTitle,
  headerActions,
  showBackButton,
  onBack
}: TenantLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Mobile: Header com Menu Toggle */}
      <div className="md:hidden">
        <div className="flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="transition-transform duration-200 hover:scale-105"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-72 flex flex-col p-0 transition-all duration-300"
            >
              {/* Header institucional no mobile */}
              <TenantHeader />
              
              {/* Menu de navegação */}
              <div className="flex-1 overflow-y-auto p-4">
                <TenantSidebar />
              </div>

              {/* Indicador de plano */}
              <div className="border-t p-4 bg-muted/20">
                <PlanUsageIndicator />
              </div>

              {/* Rodapé com usuário */}
              <TenantFooter />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-semibold text-sm">{pageTitle || 'Menu'}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Sidebar Fixa Premium */}
        <aside className="hidden w-72 border-r bg-background shadow-sm md:flex md:flex-col">
          {/* Header institucional */}
          <TenantHeader />
          
          {/* Menu de navegação com scroll suave */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <TenantSidebar />
          </div>

          {/* Indicador de plano */}
          <div className="border-t p-4 bg-muted/20">
            <PlanUsageIndicator />
          </div>

          {/* Rodapé com usuário */}
          <TenantFooter />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:block">
            <DesktopHeader 
              title={pageTitle}
              actions={headerActions}
              showBack={showBackButton}
              onBack={onBack}
            />
          </div>

          {/* Content com scroll */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-muted/5 to-background">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
