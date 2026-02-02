import type { TenantSettingsSessionDTO } from './tenant-settings';

export interface GlobalTenantLoginRequest {
  email: string;
  password: string;
}

export interface GlobalTenantLoginTenantDTO {
  id: string;
  slug: string;
  name: string;
}

export interface GlobalTenantLoginUserDTO {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: string[];
}

export interface GlobalTenantLoginResponse {
  user: GlobalTenantLoginUserDTO;
  tenant: GlobalTenantLoginTenantDTO;
  accessToken: string;
}

export interface TenantLoginResponse {
  accessToken: string;
  tenantId: string;
  activeModules: string[];
  role: string;
  permissions: string[];
  email: string;
}

export interface AuthSessionUserDTO {
  id: string;
  email: string;
  role: string;
}

export interface AuthSessionTenantDTO {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboarded: boolean;
}

export interface AuthSessionPlanDTO {
  id: string;
  name: string;
}

export interface AuthSessionSubscriptionDTO {
  id: string;
  status: string;
  plan: AuthSessionPlanDTO | null;
}

export interface AuthSessionResponse {
  user: AuthSessionUserDTO;
  tenant: AuthSessionTenantDTO | null;
  activeModules: string[];
  permissions: string[];
  subscription?: AuthSessionSubscriptionDTO | null;
  plan: AuthSessionPlanDTO | null;
  tenantSettings?: TenantSettingsSessionDTO | null;
  theme: unknown;
}

