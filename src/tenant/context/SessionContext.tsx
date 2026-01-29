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
  tenantId: string;
  email: string;
  role: string;
}

export interface ActiveModule {
  moduleId: string;
  status: 'active' | 'inactive';
  activatedAt: string;
}

export interface SessionContextValue {
  // Auth
  user: SessionUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Tenant Context
  tenantId: string | null;
  
  // Modules (runtime, from API)
  activeModules: string[];
  moduleDetails: ActiveModule[];
  isModuleEnabled: (moduleId: string) => boolean;
  
  // Permissions (opaque)
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshModules: () => Promise<void>;
  
  // Loading
  isLoading: boolean;
  isRefreshing: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [moduleDetails, setModuleDetails] = useState<ActiveModule[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived state
  const isAuthenticated = !!user && !!accessToken;
  const tenantId = user?.tenantId || null;
  const activeModules = moduleDetails
    .filter((m) => m.status === 'active')
    .map((m) => m.moduleId);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tenant_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setUser(session.user);
        setAccessToken(session.accessToken);
        setPermissions(session.permissions || []);
        
        // Fetch modules after restoring session
        fetchModules(session.accessToken, session.user.tenantId);
      } catch {
        localStorage.removeItem('tenant_session');
      }
    }
    setIsLoading(false);
  }, []);

  const fetchModules = async (token: string, tenantId: string) => {
    try {
      const response = await fetch(`/api/v1/tenant/modules`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
        },
      });

      if (!response.ok) {
        console.error('[v0] Failed to fetch modules:', response.statusText);
        return;
      }

      const data = await response.json();
      setModuleDetails(data.modules || []);
    } catch (err) {
      console.error('[v0] Error fetching modules:', err);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/tenant/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      const sessionUser: SessionUser = {
        userId: data.userId,
        tenantId: data.tenantId,
        email: data.email,
        role: data.role,
      };

      const sessionPermissions = data.permissions || [];

      setUser(sessionUser);
      setAccessToken(data.accessToken);
      setPermissions(sessionPermissions);

      // Persist to localStorage
      localStorage.setItem(
        'tenant_session',
        JSON.stringify({
          user: sessionUser,
          accessToken: data.accessToken,
          permissions: sessionPermissions,
        })
      );

      // Fetch modules after login
      await fetchModules(data.accessToken, data.tenantId);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setModuleDetails([]);
    setPermissions([]);
    localStorage.removeItem('tenant_session');
  };

  const refreshModules = async () => {
    if (!accessToken || !tenantId) return;
    
    setIsRefreshing(true);
    try {
      await fetchModules(accessToken, tenantId);
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
        activeModules,
        moduleDetails,
        isModuleEnabled,
        permissions,
        hasPermission,
        login,
        logout,
        refreshModules,
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
