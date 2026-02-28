'use client';

import React from 'react';

const SAAS_NAME = 'Pedidos Online';

type TenantHeaderProps = {
  collapsed?: boolean;
};

export function TenantHeader({ collapsed = false }: TenantHeaderProps) {
  const initials = SAAS_NAME.split(' ')
    .map((word) => (word.length > 0 ? word[0] : ''))
    .join('');

  return (
    <div className="border-b bg-gradient-to-b from-background to-muted/20">
      <div
        className={`border-b bg-muted/40 backdrop-blur-sm hidden md:flex items-center ${
          collapsed ? 'justify-center px-1.5 py-2' : 'justify-start px-4 py-2.5'
        }`}
      >
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {collapsed ? initials : SAAS_NAME}
        </p>
      </div>
    </div>
  );
}
