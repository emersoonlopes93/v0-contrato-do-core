'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu } from 'lucide-react';

/**
 * DesktopHeader - Header Premium para Desktop
 * 
 * Exibe:
 * - Título da página atual
 * - Breadcrumbs (futuro)
 * - Ações contextuais
 * 
 * Props:
 * - title: Título da página
 * - actions: Botões de ação
 * - showBack: Mostrar botão voltar
 * - onBack: Callback ao clicar em voltar
 */

type DesktopHeaderProps = {
  title?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showMenuToggle?: boolean;
  onToggleMenu?: () => void;
};

export function DesktopHeader({ 
  title = 'Dashboard', 
  actions, 
  showBack = false,
  onBack,
  showMenuToggle = false,
  onToggleMenu,
}: DesktopHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all duration-200 hover:scale-105"
              onClick={onToggleMenu}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all duration-200 hover:scale-105"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Lado direito: Ações */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
