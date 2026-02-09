'use client';

import React, { createContext, useContext } from 'react';
import { useTenant } from '@/src/contexts/TenantContext';
import type { AuthSessionResponse, TenantLoginResponse } from '@/src/types/auth';

type DriverSessionUser = {
  id: string;
  email: string;
  role: string;
};

type DriverSessionContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: DriverSessionUser | null;
  activeModules: string[];
  permissions: string[];
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const DRIVER_ACCESS_TOKEN_KEY = 'driver_access_token';
const DRIVER_REFRESH_TOKEN_KEY = 'driver_refresh_token';

const DriverSessionContext = createContext<DriverSessionContextValue | undefined>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isTenantLoginResponse(value: unknown): value is TenantLoginResponse {
  return (
    isRecord(value) &&
    isString(value.accessToken) &&
    isString(value.refreshToken) &&
    isString(value.tenantId) &&
    isString(value.role) &&
    isString(value.email) &&
    isStringArray(value.activeModules) &&
    isStringArray(value.permissions)
  );
}

function isAuthSessionResponse(value: unknown): value is AuthSessionResponse {
  if (!isRecord(value)) return false;
  if (!('user' in value) || !isRecord(value.user)) return false;
  if (!isString(value.user.id) || !isString(value.user.email) || !isString(value.user.role)) return false;
  if (!('activeModules' in value) || !isStringArray(value.activeModules)) return false;
  if (!('permissions' in value) || !isStringArray(value.permissions)) return false;
  if (!('tenant' in value)) return false;
  if (value.tenant !== null) {
    if (!isRecord(value.tenant)) return false;
    if (!isString(value.tenant.id) || !isString(value.tenant.slug)) return false;
  }
  return true;
}

export function DriverSessionProvider({ children }: { children: React.ReactNode }) {
  const { tenantSlug } = useTenant();
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<DriverSessionUser | null>(null);
  const [activeModules, setActiveModules] = React.useState<string[]>([]);
  const [permissions, setPermissions] = React.useState<string[]>([]);
  const [tenantId, setTenantId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshSession = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/auth/session', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-Slug': tenantSlug,
        },
      });
      const raw: unknown = await response.json().catch(() => null);
      if (!response.ok || !isAuthSessionResponse(raw)) {
        throw new Error('Sessão inválida');
      }
      setUser({ id: raw.user.id, email: raw.user.email, role: raw.user.role });
      setActiveModules(raw.activeModules);
      setPermissions(raw.permissions);
      setTenantId(raw.tenant?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sessão inválida');
      setUser(null);
      setActiveModules([]);
      setPermissions([]);
      setTenantId(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem(DRIVER_ACCESS_TOKEN_KEY);
      localStorage.removeItem(DRIVER_REFRESH_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, [accessToken, tenantSlug]);

  React.useEffect(() => {
    const storedAccess = localStorage.getItem(DRIVER_ACCESS_TOKEN_KEY);
    const storedRefresh = localStorage.getItem(DRIVER_REFRESH_TOKEN_KEY);
    if (!storedAccess) {
      setLoading(false);
      return;
    }
    setAccessToken(storedAccess);
    setRefreshToken(storedRefresh);
    void refreshSession();
  }, [refreshSession]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/auth/tenant/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Slug': tenantSlug,
          },
          body: JSON.stringify({ email, password }),
        });
        const raw: unknown = await response.json().catch(() => null);
        if (!response.ok || !isTenantLoginResponse(raw)) {
          const message =
            isRecord(raw) && isString(raw.error) ? raw.error : 'Falha ao autenticar';
          throw new Error(message);
        }
        setAccessToken(raw.accessToken);
        setRefreshToken(raw.refreshToken);
        setActiveModules(raw.activeModules);
        setPermissions(raw.permissions);
        setTenantId(raw.tenantId);
        setUser({ id: raw.tenantId, email: raw.email, role: raw.role });
        localStorage.setItem(DRIVER_ACCESS_TOKEN_KEY, raw.accessToken);
        localStorage.setItem(DRIVER_REFRESH_TOKEN_KEY, raw.refreshToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao autenticar');
      } finally {
        setLoading(false);
      }
    },
    [tenantSlug],
  );

  const logout = React.useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setActiveModules([]);
    setPermissions([]);
    setTenantId(null);
    setError(null);
    localStorage.removeItem(DRIVER_ACCESS_TOKEN_KEY);
    localStorage.removeItem(DRIVER_REFRESH_TOKEN_KEY);
  }, []);

  const value: DriverSessionContextValue = {
    accessToken,
    refreshToken,
    user,
    activeModules,
    permissions,
    tenantId,
    loading,
    error,
    login,
    logout,
    refreshSession,
  };

  return <DriverSessionContext.Provider value={value}>{children}</DriverSessionContext.Provider>;
}

export function useDriverSession(): DriverSessionContextValue {
  const ctx = useContext(DriverSessionContext);
  if (!ctx) {
    throw new Error('useDriverSession must be used within DriverSessionProvider');
  }
  return ctx;
}
