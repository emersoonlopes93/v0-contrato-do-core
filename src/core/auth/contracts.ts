/**
 * Auth Contracts
 * 
 * Interfaces para autenticação do Core
 */

import type { AuthToken, SaaSAdminToken, TenantUserToken, UserContext } from "../types/index";

// Re-export types
export type { AuthToken, SaaSAdminToken, TenantUserToken, UserContext };

/**
 * Auth Service Interface
 * Implementado em /src/core/auth/saas-admin e /src/core/auth/tenant
 */
export interface IAuthService {
  login(credentials: unknown): Promise<unknown>;
  register(data: unknown): Promise<unknown>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
  logout(refreshToken: string): Promise<void>;
}

/**
 * Auth Guard Interface
 * Implementado em /src/core/auth/guards.ts
 */
export interface IAuthGuard {
  requireSaaSAdmin(context: unknown): Promise<unknown>;
  requireTenantUser(context: unknown): Promise<unknown>;
  requirePermission(context: unknown, permission: string): Promise<unknown>;
  requireRole(context: unknown, role: string): Promise<unknown>;
}

/**
 * Auth Repository Interface
 * Implementado em /src/adapters/prisma/repositories/auth-repository.ts
 */
export interface IAuthRepository {
  findSaaSAdminByEmail(email: string): Promise<unknown>;
  findTenantUserByEmail(tenantId: string, email: string): Promise<unknown>;
  getTenantUserPermissions(userId: string, tenantId: string): Promise<string[]>;
  getTenantActiveModules(tenantId: string): Promise<string[]>;
  saveRefreshToken(data: unknown): Promise<unknown>;
  revokeRefreshToken(token: string): Promise<unknown>;
}
