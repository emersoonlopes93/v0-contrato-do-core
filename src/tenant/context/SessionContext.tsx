'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * Session Context - Unified Session State
 * 
 * RESPONSIBILITIES:
 * - Authentication state (token-based, opaque)
 * - Tenant context (from token)
 * - Active modules (fetched from API, runtime-based)
 * - Permissions (opaque, from API, NOT inferred)
 * 
 * RULES:
 * - Token ONLY authenticates
 * - Modules fetched from API (not hardcoded)
 * - Permissions opaque (no client-side logic)
 * - UI reacts to module activation/deactivation at runtime
 */

export interface SessionUser {
  userId: string;
  tenantId: string | null;
  email: string;
  role: string;
}

export interface SessionPlan {
  code: string;
  name: string;
  limits: Record<string, number>;
}

export interface SessionContextValue {
  // Auth
  user: SessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Tenant Context
  tenantId: string | null;
  tenantOnboarded: boolean;
  tenantStatus: string | null;
  
  // Plan
  plan: SessionPlan | null;

  // Modules (runtime, from API)
  activeModules: string[];
  isModuleEnabled: (moduleId: string) => boolean;
  
  // Permissions (opaque)
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  
  // Actions
  loginTenant: (email: string, password: string) => Promise<string[]>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  
  // Loading
  isLoading: boolean;
  isRefreshing: boolean;
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tenantOnboarded, setTenantOnboarded] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived state
  const isAuthenticated = !!user && !!accessToken;
  const tenantId = user?.tenantId || null;

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setAccessToken(storedToken);
    fetchSession(storedToken).catch(() => {
      logout();
    });
  }, []);

  const fetchSession = async (token: string): Promise<{
    activeModules: string[];
    permissions: string[];
    tenantOnboarded: boolean;
    tenantStatus: string | null;
  }> => {
    try {
      const response = await fetch('/api/v1/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      
      const sessionUser: SessionUser = {
        userId: data.user.id,
        tenantId: data.tenant?.id || null,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(sessionUser);
      const nextTenantOnboarded = data.tenant?.onboarded || false;
      const nextTenantStatus: string | null =
        typeof data.tenant?.status === 'string' ? data.tenant.status : null;
      const nextActiveModules: string[] = Array.isArray(data.activeModules)
        ? data.activeModules
        : [];
      const nextPermissions: string[] = Array.isArray(data.permissions)
        ? data.permissions
        : [];

      setTenantOnboarded(nextTenantOnboarded);
      setTenantStatus(nextTenantStatus);
      setActiveModules(nextActiveModules);
      setPermissions(nextPermissions);
      
      return {
        activeModules: nextActiveModules,
        permissions: nextPermissions,
        tenantOnboarded: nextTenantOnboarded,
        tenantStatus: nextTenantStatus,
      };
    } catch (err) {
      console.error('[Session] Error fetching session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginTenant = async (email: string, password: string): Promise<string[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/tenant/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': 'demo',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data: unknown = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid login response');
      }

      const loginData = data as {
        accessToken?: string;
        activeModules?: unknown;
      };

      if (!loginData.accessToken) {
        throw new Error('Invalid login response');
      }

      const token = loginData.accessToken as string;
      const loginActiveModules: string[] = Array.isArray(loginData.activeModules)
        ? loginData.activeModules.filter((m): m is string => typeof m === 'string')
        : [];
      
      setAccessToken(token);
      localStorage.setItem('auth_token', token);

      try {
        const sessionData = await fetchSession(token);
        const sessionModules = sessionData.activeModules;
        return sessionModules.length > 0 ? sessionModules : loginActiveModules;
      } catch {
        return loginActiveModules;
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setActiveModules([]);
    setPermissions([]);
    setPlan(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_session'); // Cleanup old key
  };

  const refreshSession = async () => {
    if (!accessToken) return;
    
    setIsRefreshing(true);
    try {
      await fetchSession(accessToken);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isModuleEnabled = (moduleId: string): boolean => {
    return activeModules.includes(moduleId);
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        tenantId,
        tenantOnboarded,
        tenantStatus,
        plan,
        activeModules,
        isModuleEnabled,
        permissions,
        hasPermission,
        loginTenant,
        logout,
        refreshSession,
        isLoading,
        isRefreshing,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
