import type { ReactNode } from 'react';
import type { TenantSettingsSessionDTO } from '@/src/types/tenant-settings';

export interface TenantContextValue {
  tenantSlug: string;
}

export interface TenantProviderProps {
  tenantSlug: string;
  children: ReactNode;
}

export interface SessionUser {
  userId: string;
  tenantId: string | null;
  email: string;
  role: string;
}

export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboarded: boolean;
}

export interface SessionPlan {
  code: string;
  name: string;
  limits: Record<string, number>;
}

export interface SessionContextValue {
  user: SessionUser | null;
  accessToken: string | null;
  authError: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantOnboarded: boolean;
  tenantStatus: string | null;
  plan: SessionPlan | null;
  tenantSettings: TenantSettingsSessionDTO | null;
  activeModules: string[];
  isModuleEnabled: (moduleId: string) => boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  loginTenant: (email: string, password: string) => Promise<string[]>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
}

export interface ModuleGuardProps {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

