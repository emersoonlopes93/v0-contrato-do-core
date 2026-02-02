'use client';

import React from 'react';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { ExternalLink } from 'lucide-react';

/**
 * TenantHeader - Header Institucional
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
    <div className="border-b bg-background">
      {/* Nome do SaaS */}
      <div className="border-b px-4 py-2 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {SAAS_NAME}
        </p>
      </div>

      {/* Informações do Tenant */}
      <div className="px-4 py-3 space-y-2">
        {/* Logo/Nome do Restaurante */}
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {restaurantName}
          </h1>
        </div>

        {/* Status da Loja */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Loja {isOpen ? 'aberta' : 'fechada'}
          </span>
        </div>

        {/* Link Cardápio Público */}
        <a
          href={menuPublicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Ver Cardápio Público
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
