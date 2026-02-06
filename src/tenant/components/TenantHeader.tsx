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

  const isOpen = tenantSettings?.isOpen ?? false;
  const restaurantName = tenantSettings?.tradeName ?? tenantSlug ?? '';
  const menuPublicUrl = `/menu/${tenantSlug}`;

  return (
    <div className="border-b bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-muted/40 backdrop-blur-sm px-4 py-2.5 hidden md:block">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {SAAS_NAME}
        </p>
      </div>

      {/* Informações do Tenant */}
      <div className="px-4 py-4 space-y-3.5">
        <div className="hidden md:flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight truncate">
              {restaurantName}
            </h1>
          </div>
        </div>

        <div className="flex justify-center">
          <Badge
            variant="outline"
            className={`font-medium transition-all duration-200 ${
              isOpen
                ? 'bg-success-soft text-success border-success/20'
                : 'bg-danger-soft text-danger border-danger/20'
            }`}
          >
            <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isOpen ? 'bg-success' : 'bg-danger'}`} />
            {isOpen ? '🟢 Loja aberta' : '🔴 Loja fechada'}
          </Badge>
        </div>

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
