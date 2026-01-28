import type { AuthToken, SaaSAdminToken, TenantUserToken, UserContext } from "../types/index";

export interface AuthService {
  generateSaaSAdminToken(userId: string, role: "admin" | "moderator"): Promise<SaaSAdminToken>;
  generateTenantUserToken(
    userId: string,
    tenantId: string,
    role: string,
    permissions: string[],
    activeModules: string[]
  ): Promise<TenantUserToken>;

  verifySaaSAdminToken(token: SaaSAdminToken): Promise<boolean>;
  verifyTenantUserToken(token: TenantUserToken): Promise<boolean>;

  extractContext(token: AuthToken): UserContext;
}

export interface AuthGuard {
  requireSaaSAdmin(token: AuthToken): Promise<SaaSAdminToken>;
  requireTenantUser(token: AuthToken): Promise<TenantUserToken>;
  requirePermission(token: TenantUserToken, permission: string): Promise<boolean>;
  requireModule(token: TenantUserToken, moduleId: string): Promise<boolean>;
}

export interface AuthRepository {
  saveSaaSAdminUser(userId: string, email: string, role: "admin" | "moderator"): Promise<void>;
  saveTenantUser(userId: string, tenantId: string, email: string, role: string): Promise<void>;
  getTenantUserPermissions(userId: string, tenantId: string): Promise<string[]>;
  getTenantUserActiveModules(userId: string, tenantId: string): Promise<string[]>;
}
