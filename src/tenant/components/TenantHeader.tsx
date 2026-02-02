'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { ExternalLink, Store } from 'lucide-react';

/**
 * TenantHeader - Header Institucional Premium
 * 
 * HIERARQUIA (de cima para baixo):
 * 1. Nome do SaaS
 * 2. Logo ou Nome do Restaurante (Tenant)
 * 3. Status da Loja: Aberta | Fechada
 * 4. Link: Ver Cardápio Público
 */

const SAAS_NAME = 'Pedidos Online';

export function TenantHeader() {
  const { tenantSettings } = useSession();
  const { tenantSlug } = useTenant();

  // Status da loja
  const isOpen = tenantSettings?.isOpen ?? false;
  
  // Nome do restaurante
  const restaurantName = tenantSettings?.tradeName ?? 'Restaurante';

  // URL do cardápio público
  const menuPublicUrl = `/menu/${tenantSlug}`;

  return (
    <div className="border-b bg-gradient-to-b from-background to-muted/20">
      {/* Nome do SaaS - Elegante */}
      <div className="border-b bg-muted/40 backdrop-blur-sm px-4 py-2.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {SAAS_NAME}
        </p>
      </div>

      {/* Informações do Tenant */}
      <div className="px-4 py-4 space-y-3.5">
        {/* Logo/Nome do Restaurante com ícone */}
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight truncate">
              {restaurantName}
            </h1>
          </div>
        </div>

        {/* Status da Loja - Badge Premium */}
        <Badge 
          variant={isOpen ? 'default' : 'secondary'}
          className={`
            font-medium transition-all duration-200
            ${isOpen 
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20' 
              : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
            }
          `}
        >
          <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
        </Badge>

        {/* Link Cardápio Público - Botão elegante */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between h-9 font-medium transition-all duration-200 hover:bg-primary/5 hover:border-primary/50"
          asChild
        >
          <a
            href={menuPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver Cardápio Público
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
