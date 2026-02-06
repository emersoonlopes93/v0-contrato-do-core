'use client';

import React from "react"
import { TenantHeader } from './TenantHeader';
import { TenantSidebar } from './TenantSidebar';
import { TenantFooter } from './TenantFooter';
import { DesktopHeader } from './DesktopHeader';
import { PlanUsageIndicator } from './PlanUsageIndicator';
import { MobileBottomNav } from './MobileBottomNav';

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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Mobile: Header com TenantHeader */}
      <div className="md:hidden">
        <TenantHeader />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tablet e Desktop: Sidebar Fixa Premium */}
        <aside className="hidden w-72 border-r bg-background shadow-sm lg:flex lg:flex-col">
          {/* Header institucional */}
          <TenantHeader />
          
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
          {/* Tablet e Desktop Header */}
          <div className="hidden lg:block">
            <DesktopHeader 
              title={pageTitle}
              actions={headerActions}
              showBack={showBackButton}
              onBack={onBack}
            />
          </div>

          {/* Content com scroll - Mobile e Tablet com padding bottom para o menu inferior */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-muted/5 to-background lg:pb-0 pb-16">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile: Menu Inferior */}
      <MobileBottomNav />
    </div>
  );
}
