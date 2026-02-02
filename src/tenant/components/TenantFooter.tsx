'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '../context/SessionContext';
import { User, LogOut } from 'lucide-react';

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

  return (
    <div className="border-t bg-background p-4 space-y-3">
      {/* Informações do usuário */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            Olá, {user.email.split('@')[0]}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* Botão de logout */}
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
