import type { TenantId, UserId, Tenant, TenantUser } from "../types/index";

export interface TenantService {
  createTenant(name: string, planId: string): Promise<Tenant>;
  getTenantById(tenantId: TenantId): Promise<Tenant | null>;
  updateTenant(tenantId: TenantId, data: Partial<Tenant>): Promise<Tenant>;
  deleteTenant(tenantId: TenantId): Promise<void>;
  listTenants(): Promise<Tenant[]>;
}

export interface TenantUserService {
  createTenantUser(userId: UserId, tenantId: TenantId, email: string, role: string): Promise<TenantUser>;
  getTenantUser(userId: UserId, tenantId: TenantId): Promise<TenantUser | null>;
  updateTenantUser(userId: UserId, tenantId: TenantId, data: Partial<TenantUser>): Promise<TenantUser>;
  deleteTenantUser(userId: UserId, tenantId: TenantId): Promise<void>;
  listTenantUsers(tenantId: TenantId): Promise<TenantUser[]>;
  getUserTenants(userId: UserId): Promise<Tenant[]>;
}

export interface TenantRepository {
  saveTenant(tenant: Tenant): Promise<void>;
  getTenantById(tenantId: TenantId): Promise<Tenant | null>;
  updateTenant(tenantId: TenantId, data: Partial<Tenant>): Promise<void>;
  deleteTenant(tenantId: TenantId): Promise<void>;
  listTenants(): Promise<Tenant[]>;

  saveTenantUser(user: TenantUser): Promise<void>;
  getTenantUser(userId: UserId, tenantId: TenantId): Promise<TenantUser | null>;
  updateTenantUser(userId: UserId, tenantId: TenantId, data: Partial<TenantUser>): Promise<void>;
  deleteTenantUser(userId: UserId, tenantId: TenantId): Promise<void>;
  listTenantUsers(tenantId: TenantId): Promise<TenantUser[]>;
  getUserTenants(userId: UserId): Promise<Tenant[]>;
}
