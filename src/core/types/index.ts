export type UUID = string & { readonly __brand: "UUID" };

export function asUUID(value: string): UUID {
  return value as UUID;
}

export type TenantId = UUID;
export type UserId = UUID;
export type ModuleId = string & { readonly __brand: "ModuleId" };

export function asModuleId(value: string): ModuleId {
  return value as ModuleId;
}

export enum UserContext {
  SAAS_ADMIN = "saas_admin",
  TENANT_USER = "tenant_user",
}

export interface SaaSAdminToken {
  context: UserContext.SAAS_ADMIN;
  userId: UserId;
  role: "admin" | "moderator";
}

export interface TenantUserToken {
  context: UserContext.TENANT_USER;
  userId: UserId;
  tenantId: TenantId;
  role: string;
  permissions: string[];
  activeModules: ModuleId[];
}

export type AuthToken = SaaSAdminToken | TenantUserToken;

export interface Tenant {
  id: TenantId;
  name: string;
  planId: string;
  status: "active" | "suspended" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: UserId;
  tenantId: TenantId;
  email: string;
  role: string;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface SaaSAdminUser {
  id: UserId;
  email: string;
  role: "admin" | "moderator";
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  version: string;
  permissions: string[];
  events: string[];
  requiredPlan?: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  modules: ModuleId[];
  limits: Record<string, number | unlimited>;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export type unlimited = -1;

export interface WhiteBrandConfig {
  tenantId: TenantId;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  domain?: string;
  customMetadata?: Record<string, unknown>;
}

export interface GlobalWhiteBrandConfig {
  systemName: string;
  systemLogo?: string;
  supportEmail: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface AuditEvent {
  id: UUID;
  tenantId?: TenantId;
  userId: UserId;
  action: string;
  resource: string;
  oldValue?: unknown;
  newValue?: unknown;
  status: "success" | "failure";
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
