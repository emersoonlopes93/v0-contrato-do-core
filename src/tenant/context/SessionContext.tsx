'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTenant } from '@/src/contexts/TenantContext';
import type { SessionContextValue, SessionUser, SessionTenant, SessionPlan } from '@/src/types/tenant';
import type { AuthSessionResponse, TenantLoginCookieResponse } from '@/src/types/auth';
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

function isTenantLoginResponse(value: unknown): value is TenantLoginCookieResponse {
  return (
    isRecord(value) &&
    value.ok === true &&
    isString(value.tenantId) &&
    isStringArray(value.activeModules) &&
    isString(value.role) &&
    isStringArray(value.permissions) &&
    isString(value.email)
  );
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
    const response = await fetch('/api/v1/auth/tenant/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;
    return 'cookie';
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
        credentials: 'include',
        headers: {
          'X-Auth-Context': 'tenant_user',
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
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchSession('cookie')
      .then(({ activeModules: mods }) => {
        setActiveModules(mods);
      })
      .catch(() => undefined);
  }, [fetchSession]);

  const loginTenant = async (email: string, password: string): Promise<string[]> => {
    setIsLoading(true);
    try {
      console.log('[TenantResolver] tenantSlug:', tenantSlug);
      if (tenantSlug.trim().length === 0) {
        throw new Error('Tenant não resolvido');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': tenantSlug,
      };

      const response = await fetch('/api/v1/auth/tenant/login', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ email, password }),
      });

      const raw: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (isRecord(raw) && isString(raw.error)) {
          throw new Error(raw.error);
        }
        throw new Error('Login failed');
      }

      if (!isTenantLoginResponse(raw)) {
        throw new Error('Invalid login response');
      }

      const loginActiveModules = raw.activeModules;
      setAuthError(null);

      await fetchSession('cookie');

      return loginActiveModules;
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Falha ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const refreshSession = async () => {
    setIsRefreshing(true);
    try {
      await fetchSession('cookie');
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
