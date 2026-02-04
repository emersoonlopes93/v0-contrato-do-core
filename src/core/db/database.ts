/**
 * Database - Factory Pattern
 * 
 * Core expõe apenas interfaces e factory.
 * Implementações específicas ficam em /adapters
 */

import type {
  IDatabaseAdapter,
  IDatabaseAdapterFactory,
  IRepository,
  ITransaction,
  ITenantContext,
  IQueryFilter,
  IQueryOptions,
} from './contracts';

// Re-export interfaces
export type {
  IDatabaseAdapter,
  IDatabaseAdapterFactory,
  IRepository,
  ITransaction,
  ITenantContext,
  IQueryFilter,
  IQueryOptions,
};

// Database Entity Types
export interface Database {
  tenants: TenantTable;
  tenantUsers: TenantUserTable;
  saasAdminUsers: SaaSAdminUserTable;
  plans: PlanTable;
  tenantSubscriptions: TenantSubscriptionTable;
  modules: ModuleTable;
  tenantModules: TenantModuleTable;
  roles: RoleTable;
  permissions: PermissionTable;
  rolePermissions: RolePermissionTable;
  userRoles: UserRoleTable;
  whiteBrandConfigs: WhiteBrandTable;
  auditEvents: AuditEventTable;
}

export interface TenantTable {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "deleted";
  created_at: Date;
  updated_at: Date;
}

export interface TenantSubscriptionTable {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired";
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TenantUserTable {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  name: string | null;
  status: "active" | "inactive" | "deleted";
  created_at: Date;
  updated_at: Date;
}

export interface SaaSAdminUserTable {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: "admin" | "moderator";
  status: "active" | "inactive" | "deleted";
  created_at: Date;
  updated_at: Date;
}

export interface PlanTable {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  limits: Record<string, number>;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface ModuleTable {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  permissions: string[];
  events: string[];
  required_plan: string | null;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface TenantModuleTable {
  id: string;
  tenant_id: string;
  module_id: string;
  status: "active" | "inactive";
  activated_at: Date;
  deactivated_at: Date | null;
}

export interface RoleTable {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionTable {
  id: string;
  module_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: Date;
}

export interface RolePermissionTable {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: Date;
}

export interface UserRoleTable {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  assigned_at: Date;
}

export interface WhiteBrandTable {
  id: string;
  tenant_id: string;
  logo: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string | null;
  theme: string | null;
  domain: string | null;
  custom_metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuditEventTable {
  id: string;
  tenant_id: string | null;
  user_id: string;
  action: string;
  resource: string;
  old_value: unknown | null;
  new_value: unknown | null;
  status: "success" | "failure";
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

// Database Adapter Factory
let databaseAdapterFactory: IDatabaseAdapterFactory | null = null;

export function registerDatabaseAdapterFactory(factory: IDatabaseAdapterFactory) {
  databaseAdapterFactory = factory;
}

export async function createDatabaseAdapter(
  connectionString?: string
): Promise<IDatabaseAdapter> {
  if (!databaseAdapterFactory) {
    throw new Error(
      'Database adapter factory not registered. Call registerDatabaseAdapterFactory() first.'
    );
  }

  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not provided');
  }

  return await databaseAdapterFactory.create(dbUrl);
}
