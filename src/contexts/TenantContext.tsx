'use client';

import { createContext, useContext } from 'react';
import type { TenantContextValue, TenantProviderProps } from '@/src/types/tenant';

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ tenantSlug, children }: TenantProviderProps) {
  const normalized = tenantSlug.trim();
  if (normalized.length === 0) {
    throw new Error('Tenant não resolvido');
  }

  return (
    <TenantContext.Provider value={{ tenantSlug: normalized }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

