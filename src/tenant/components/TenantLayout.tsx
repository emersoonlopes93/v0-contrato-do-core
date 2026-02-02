'use client';

import React, { useState } from "react"
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { TenantHeader } from './TenantHeader';
import { TenantSidebar } from './TenantSidebar';
import { TenantFooter } from './TenantFooter';
import { PlanUsageIndicator } from './PlanUsageIndicator';

/**
 * Tenant Layout - Layout Base Oficial
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
 * - Mobile-first com sidebar colapsável
 * - Desktop com sidebar fixa
 * - Sem lógica de negócio, apenas estrutura
 */

export function TenantLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile: Toggle Button + Sheet */}
      <div className="md:hidden">
        <div className="flex h-14 items-center border-b bg-background px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col p-0">
              {/* Header institucional no mobile */}
              <TenantHeader />
              
              {/* Menu de navegação */}
              <div className="flex-1 overflow-y-auto p-4">
                <TenantSidebar />
              </div>

              {/* Indicador de plano */}
              <div className="border-t p-4">
                <PlanUsageIndicator />
              </div>

              {/* Rodapé com usuário */}
              <TenantFooter />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-semibold">Menu</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Sidebar Fixa */}
        <aside className="hidden w-72 border-r bg-background md:flex md:flex-col">
          {/* Header institucional */}
          <TenantHeader />
          
          {/* Menu de navegação */}
          <div className="flex-1 overflow-y-auto p-4">
            <TenantSidebar />
          </div>

          {/* Indicador de plano */}
          <div className="border-t p-4">
            <PlanUsageIndicator />
          </div>

          {/* Rodapé com usuário */}
          <TenantFooter />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
