import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Database {
  tenants: TenantTable;
  tenantUsers: TenantUserTable;
  saasAdminUsers: SaaSAdminUserTable;
  plans: PlanTable;
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
  plan_id: string;
  status: "active" | "suspended" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface TenantUserTable {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface SaaSAdminUserTable {
  id: string;
  email: string;
  role: "admin" | "moderator";
  status: "active" | "inactive" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface PlanTable {
  id: string;
  name: string;
  description: string;
  modules: string[];
  limits: Record<string, number>;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface ModuleTable {
  id: string;
  name: string;
  version: string;
  permissions: string[];
  events: string[];
  required_plan: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface TenantModuleTable {
  id: string;
  tenant_id: string;
  module_id: string;
  status: "active" | "inactive";
  activated_at: string;
  deactivated_at: string | null;
}

export interface RoleTable {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionTable {
  id: string;
  module_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface RolePermissionTable {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface UserRoleTable {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  assigned_at: string;
}

export interface WhiteBrandTable {
  id: string;
  tenant_id: string | null;
  logo: string | null;
  primary_color: string;
  secondary_color: string;
  domain: string | null;
  custom_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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
  timestamp: string;
}
