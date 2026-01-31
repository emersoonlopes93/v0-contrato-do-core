import { JWTService } from './jwt';
import type { SaaSAdminToken, TenantUserToken } from './contracts';
import { TenantContextResolver } from '../context/tenant-context';
import { tenantModuleService } from '../../adapters/prisma/modules/tenant-module.service';
import type { ModuleId, TenantId } from '../types/index';

export interface GuardContext {
  token?: string;
  headers?: Record<string, string>;
  subdomain?: string;
  pathParams?: Record<string, string>;
}

export interface SaaSAdminGuardResult {
  isAuthenticated: true;
  token: SaaSAdminToken;
}

export interface TenantUserGuardResult {
  isAuthenticated: true;
  token: TenantUserToken;
  tenantId: TenantId;
}

/**
 * Auth Guards
 * 
 * Middlewares de autenticação para proteger rotas
 */
export class AuthGuards {
  private tenantResolver = new TenantContextResolver();

  // ==========================================
  // SAAS ADMIN GUARD
  // ==========================================

  async requireSaaSAdmin(context: GuardContext): Promise<SaaSAdminGuardResult> {
    if (!context.token) {
      throw new Error('Authentication token required');
    }

    const token = JWTService.verifySaaSAdminToken(context.token);

    if (token.context !== 'saas_admin') {
      throw new Error('Invalid token context: expected saas_admin');
    }

    return {
      isAuthenticated: true,
      token,
    };
  }

  // ==========================================
  // TENANT USER GUARD
  // ==========================================

  async requireTenantUser(context: GuardContext): Promise<TenantUserGuardResult> {
    if (!context.token) {
      throw new Error('Authentication token required');
    }

    const token = JWTService.verifyTenantUserToken(context.token);

    if (token.context !== 'tenant_user') {
      throw new Error('Invalid token context: expected tenant_user');
    }

    // Resolve tenant context
    const tenantContext = await this.tenantResolver.resolve({
      token: context.token,
      headers: context.headers,
      subdomain: context.subdomain,
      pathParams: context.pathParams,
    });

    // IMPORTANTE: tenant_id do token tem precedência
    if (tenantContext.tenantId !== token.tenantId) {
      throw new Error('Tenant mismatch: token tenant_id does not match resolved tenant_id');
    }

    return {
      isAuthenticated: true,
      token,
      tenantId: token.tenantId,
    };
  }

  // ==========================================
  // PERMISSION GUARD
  // ==========================================

  async requirePermission(
    context: GuardContext,
    requiredPermission: string
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    if (!result.token.permissions.includes(requiredPermission)) {
      throw new Error(`Permission denied: ${requiredPermission} required`);
    }

    return result;
  }

  async requireAnyPermission(
    context: GuardContext,
    requiredPermissions: string[]
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    const hasPermission = requiredPermissions.some((perm) =>
      result.token.permissions.includes(perm)
    );

    if (!hasPermission) {
      throw new Error(`Permission denied: one of [${requiredPermissions.join(', ')}] required`);
    }

    return result;
  }

  async requireAllPermissions(
    context: GuardContext,
    requiredPermissions: string[]
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    const missingPermissions = requiredPermissions.filter(
      (perm) => !result.token.permissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      throw new Error(`Permission denied: missing [${missingPermissions.join(', ')}]`);
    }

    return result;
  }

  // ==========================================
  // ROLE GUARD
  // ==========================================

  async requireRole(
    context: GuardContext,
    requiredRole: string
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    if (result.token.role !== requiredRole) {
      throw new Error(`Role denied: ${requiredRole} required`);
    }

    return result;
  }

  async requireAnyRole(
    context: GuardContext,
    requiredRoles: string[]
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    if (!requiredRoles.includes(result.token.role)) {
      throw new Error(`Role denied: one of [${requiredRoles.join(', ')}] required`);
    }

    return result;
  }

  // ==========================================
  // MODULE GUARD
  // ==========================================

  /**
   * Require module to be enabled for tenant
   * 
   * Resolves tenant_id from context and checks if module is active.
   * Composable with other guards.
   */
  async requireModule(
    context: GuardContext,
    moduleId: ModuleId
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    // Check if module is enabled for this tenant
    const isEnabled = await tenantModuleService.isEnabled(result.tenantId, moduleId);

    if (!isEnabled) {
      throw new Error(`Module ${moduleId} is not enabled for this tenant`);
    }

    return result;
  }

  /**
   * Require any of the specified modules to be enabled
   */
  async requireAnyModule(
    context: GuardContext,
    moduleIds: ModuleId[]
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    const checks = await Promise.all(
      moduleIds.map((moduleId) =>
        tenantModuleService.isEnabled(result.tenantId, moduleId)
      )
    );

    const hasAnyModule = checks.some((enabled) => enabled);

    if (!hasAnyModule) {
      throw new Error(`One of modules [${moduleIds.join(', ')}] must be enabled for this tenant`);
    }

    return result;
  }

  /**
   * Require all specified modules to be enabled
   */
  async requireAllModules(
    context: GuardContext,
    moduleIds: ModuleId[]
  ): Promise<TenantUserGuardResult> {
    const result = await this.requireTenantUser(context);

    const checks = await Promise.all(
      moduleIds.map(async (moduleId) => ({
        moduleId,
        enabled: await tenantModuleService.isEnabled(result.tenantId, moduleId),
      }))
    );

    const disabledModules = checks.filter((check) => !check.enabled).map((check) => check.moduleId);

    if (disabledModules.length > 0) {
      throw new Error(`Modules [${disabledModules.join(', ')}] must be enabled for this tenant`);
    }

    return result;
  }
}
