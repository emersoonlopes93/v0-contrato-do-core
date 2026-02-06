'use client';

import React from 'react';
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
  return (
    <div className="border-b bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-muted/40 backdrop-blur-sm px-4 py-2.5 hidden md:block">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {SAAS_NAME}
        </p>
      </div>
    </div>
  );
}
