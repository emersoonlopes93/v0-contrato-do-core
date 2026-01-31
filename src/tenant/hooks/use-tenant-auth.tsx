'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Tenant Auth Context
 * 
 * Gerencia autenticação do tenant user via API pública
 */

export interface TenantUserToken {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  email: string;
}

export interface TenantAuthContextValue {
  token: TenantUserToken | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextValue | undefined>(undefined);

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<TenantUserToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const stored = localStorage.getItem('tenant_token');
    if (stored) {
      try {
        setToken(JSON.parse(stored));
      } catch {
        localStorage.removeItem('tenant_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/tenant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': 'demo' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userToken: TenantUserToken = {
        userId: data.userId,
        tenantId: data.tenantId,
        role: data.role,
        permissions: data.permissions,
        email: data.email,
      };

      setToken(userToken);
      localStorage.setItem('tenant_token', JSON.stringify(userToken));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('tenant_token');
  };

  return (
    <TenantAuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </TenantAuthContext.Provider>
  );
}

export function useTenantAuth() {
  const context = useContext(TenantAuthContext);
  if (!context) {
    throw new Error('useTenantAuth must be used within TenantAuthProvider');
  }
  return context;
}
