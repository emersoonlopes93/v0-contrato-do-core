'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTenant } from '@/src/contexts/TenantContext';
import type { SessionContextValue, SessionUser, SessionTenant, SessionPlan } from '@/src/types/tenant';
import type { AuthSessionResponse, TenantLoginResponse } from '@/src/types/auth';
import type { TenantSettingsSessionDTO } from '@/src/types/tenant-settings';

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

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const TENANT_ACCESS_TOKEN_KEY = 'tenant_access_token';
const TENANT_REFRESH_TOKEN_KEY = 'tenant_refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'auth_token';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isTenantSettingsSessionDTO(value: unknown): value is TenantSettingsSessionDTO {
  if (!isRecord(value)) return false;
  if (!('tradeName' in value) || !isNullableString(value.tradeName)) return false;
  if (!('isOpen' in value) || typeof value.isOpen !== 'boolean') return false;
  if (!('city' in value) || !isNullableString(value.city)) return false;
  if (!('state' in value) || !isNullableString(value.state)) return false;
  if (!('timezone' in value) || !isNullableString(value.timezone)) return false;
  if (!('paymentProviderDefault' in value) || !isNullableString(value.paymentProviderDefault)) return false;
  if (!('paymentPublicKey' in value) || !isNullableString(value.paymentPublicKey)) return false;
  if (!('paymentPrivateKey' in value) || !isNullableString(value.paymentPrivateKey)) return false;
  if (!('kdsEnabled' in value) || typeof value.kdsEnabled !== 'boolean') return false;
  if (!('pdvEnabled' in value) || typeof value.pdvEnabled !== 'boolean') return false;
  if (!('realtimeEnabled' in value) || typeof value.realtimeEnabled !== 'boolean') return false;
  if (!('printingEnabled' in value) || typeof value.printingEnabled !== 'boolean') return false;
  return true;
}

function isAuthSessionResponse(value: unknown): value is AuthSessionResponse {
  if (!isRecord(value)) return false;
  if (!('user' in value)) return false;
  if (!isRecord(value.user)) return false;
  if (!isString(value.user.id) || !isString(value.user.email) || !isString(value.user.role)) return false;
  if (!('tenant' in value)) return false;
  if (!('activeModules' in value) || !isStringArray(value.activeModules)) return false;
  if (!('permissions' in value) || !isStringArray(value.permissions)) return false;
  if (!('plan' in value)) return false;
  if (!(value.plan === null || (isRecord(value.plan) && isString(value.plan.id) && isString(value.plan.name)))) return false;
  if (!('theme' in value)) return false;
  if (
    'subscription' in value &&
    !(value.subscription === null || value.subscription === undefined || (isRecord(value.subscription) && isString(value.subscription.id) && isString(value.subscription.status)))
  ) {
    return false;
  }
  if (isRecord(value.tenant)) {
    const t = value.tenant;
    if (!isString(t.id) || !isString(t.name) || !isString(t.slug) || !isString(t.status)) return false;
    if (!('onboarded' in t)) return false;
  } else if (!(value.tenant === null)) {
    return false;
  }
  if (
    'tenantSettings' in value &&
    !(value.tenantSettings === null || value.tenantSettings === undefined || isTenantSettingsSessionDTO(value.tenantSettings))
  ) {
    return false;
  }
  return true;
}

function isTenantLoginResponse(value: unknown): value is TenantLoginResponse {
  return (
    isRecord(value) &&
    isString(value.accessToken) &&
    isString(value.refreshToken) &&
    isString(value.tenantId) &&
    isStringArray(value.activeModules) &&
    isString(value.role) &&
    isStringArray(value.permissions) &&
    isString(value.email)
  );
}

function decodeJwtExpMs(token: string): number | null {
  try {
    const payloadRaw = token.split('.')[1];
    if (!payloadRaw) return null;
    const json = JSON.parse(atob(payloadRaw)) as { exp?: unknown };
    if (typeof json.exp !== 'number') return null;
    return json.exp * 1000;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { tenantSlug } = useTenant();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenant] = useState<SessionTenant | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tenantOnboarded, setTenantOnboarded] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsSessionDTO | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived state
  const tenantId = tenant?.id ?? user?.tenantId ?? null;
  const resolvedTenantSlug = tenant?.slug ?? null;

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken =
      localStorage.getItem(TENANT_REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const response = await fetch('/api/v1/auth/tenant/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const raw: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(raw) || !isString(raw.accessToken)) {
      return null;
    }

    const nextToken = raw.accessToken;
    setAccessToken(nextToken);
    localStorage.setItem(TENANT_ACCESS_TOKEN_KEY, nextToken);
    return nextToken;
  }, []);

  const fetchSession = useCallback(async function fetchSessionInternal(
    token: string,
    allowRefresh = true,
  ): Promise<{
    activeModules: string[];
    permissions: string[];
    tenantOnboarded: boolean;
    tenantStatus: string | null;
  }> {
    try {
      const response = await fetch('/api/v1/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Slug': tenantSlug,
        },
      });

      if (!response.ok) {
        if (response.status === 401 && allowRefresh) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            return await fetchSessionInternal(refreshed, false);
          }
        }
        throw new Error('Failed to fetch session');
      }

      const data: unknown = await response.json();
      if (!isAuthSessionResponse(data)) {
        throw new Error('Failed to fetch session');
      }

      const rawTenant = data.tenant;
      const nextTenant: SessionTenant | null =
        rawTenant === null
          ? null
          : {
              id: rawTenant.id,
              name: rawTenant.name,
              slug: rawTenant.slug,
              status: rawTenant.status,
              onboarded: rawTenant.onboarded === true,
            };
      
      const sessionUser: SessionUser = {
        userId: data.user.id,
        tenantId: nextTenant?.id ?? null,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(sessionUser);
      setTenant(nextTenant);

      const nextTenantOnboarded = nextTenant?.onboarded ?? false;
      const nextTenantStatus: string | null =
        typeof nextTenant?.status === 'string' ? nextTenant.status : null;
      const nextActiveModules = data.activeModules;
      const nextPermissions = data.permissions;
      const nextTenantSettings: TenantSettingsSessionDTO | null =
        data.tenantSettings === undefined ? null : data.tenantSettings;

      setTenantOnboarded(nextTenantOnboarded);
      setTenantStatus(nextTenantStatus);
      setActiveModules(nextActiveModules);
      setPermissions(nextPermissions);
      setTenantSettings(nextTenantSettings);
      
      return {
        activeModules: nextActiveModules,
        permissions: nextPermissions,
        tenantOnboarded: nextTenantOnboarded,
        tenantStatus: nextTenantStatus,
      };
    } catch (err) {
      console.error('[Session] Error fetching session:', err);
      setUser(null);
      setTenant(null);
      setTenantOnboarded(false);
      setTenantStatus(null);
      setActiveModules([]);
      setPermissions([]);
      setPlan(null);
      setTenantSettings(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, refreshAccessToken]);

  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setAccessToken(null);
    setTenantOnboarded(false);
    setTenantStatus(null);
    setTenantSettings(null);
    setActiveModules([]);
    setPermissions([]);
    setPlan(null);
    localStorage.removeItem(TENANT_ACCESS_TOKEN_KEY);
    localStorage.removeItem(TENANT_REFRESH_TOKEN_KEY);
    localStorage.removeItem('tenant_session');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedToken =
      localStorage.getItem(TENANT_ACCESS_TOKEN_KEY) ??
      localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setAccessToken(storedToken);
    fetchSession(storedToken).catch((err: unknown) => {
      setAuthError(err instanceof Error ? err.message : 'Sessão inválida');
      logout();
    });
  }, [tenantSlug, fetchSession, logout]);

  const loginTenant = async (email: string, password: string): Promise<string[]> => {
    setIsLoading(true);
    try {
      console.log('[TenantResolver] tenantSlug:', tenantSlug);
      if (tenantSlug.trim().length === 0) {
        throw new Error('Tenant não resolvido');
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      headers['X-Tenant-Slug'] = tenantSlug;

      const response = await fetch('/api/v1/auth/tenant/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const raw: unknown = await response.json().catch(() => null);
        if (isRecord(raw) && isString(raw.error)) {
          throw new Error(raw.error);
        }
        throw new Error('Login failed');
      }

      const data: unknown = await response.json();
      if (!isTenantLoginResponse(data)) {
        throw new Error('Invalid login response');
      }

      const token = data.accessToken;
      const refreshToken = data.refreshToken;
      const loginActiveModules = data.activeModules;
      
      setAccessToken(token);
      localStorage.setItem(TENANT_ACCESS_TOKEN_KEY, token);
      localStorage.setItem(TENANT_REFRESH_TOKEN_KEY, refreshToken);
      setAuthError(null);

      return loginActiveModules;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Falha ao fazer login');
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const refreshSession = async () => {
    const token =
      accessToken ??
      localStorage.getItem(TENANT_ACCESS_TOKEN_KEY) ??
      localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (!token) {
      return;
    }
    
    setIsRefreshing(true);
    try {
      await fetchSession(token);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const shouldRefreshSoon = () => {
      const expMs = decodeJwtExpMs(accessToken);
      if (!expMs) return false;
      return expMs - Date.now() <= 60 * 1000;
    };

    const tick = async () => {
      if (!shouldRefreshSoon()) return;
      await refreshAccessToken();
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 15 * 1000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [accessToken, refreshAccessToken]);

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
        authError,
        tenantId,
        tenantSlug: resolvedTenantSlug,
        tenantOnboarded,
        tenantStatus,
        plan,
        tenantSettings,
        activeModules,
        isModuleEnabled,
        permissions,
        hasPermission,
        loginTenant,
        logout,
        refreshSession,
        clearAuthError,
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
