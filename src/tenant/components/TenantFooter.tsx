'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/src/tenant/context/SessionContext';
import { LogOut } from 'lucide-react';

/**
 * TenantFooter - Rodapé
 * 
 * Exibe:
 * - Nome do usuário logado
 * - Cargo (RBAC role)
 * - Botão de logout
 */

export function TenantFooter() {
  const { user, logout } = useSession();

  if (!user) {
    return null;
  }

  // Tradução de roles para português
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    operator: 'Operador',
    cashier: 'Caixa',
    waiter: 'Garçom',
  };

  const roleLabel = roleLabels[user.role] ?? user.role;
  
  // Pega as iniciais do email
  const userName = user.email.split('@')[0];
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="border-t bg-gradient-to-t from-muted/20 to-background px-3 py-2 space-y-2">
      {/* Informações do usuário - Premium */}
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors duration-200">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-xs font-bold text-primary-foreground">{userInitial}</span>
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">
            Olá, {userName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* Botão de logout - Premium */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 font-medium hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
