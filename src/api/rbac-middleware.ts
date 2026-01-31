import type { Request, Response, NextFunction } from './middleware';
import { globalFeatureFlagProvider } from '@/src/core/feature-flags';

/**
 * Interface for Authenticated Request
 * Expected to be populated by the authentication middleware
 */
export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    tenantId: string;
    role: string;
    permissions: string[];
    activeModules: string[];
  };
}

/**
 * Tenant Module Guard Middleware
 * 
 * Ensures that:
 * 1. Request is authenticated
 * 2. Tenant ID is present
 * 3. Specific module is active for the tenant
 */
export function requireModule(moduleId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    // 1. Basic Auth Check
    if (!authReq.auth || !authReq.auth.tenantId) {
      res.status = 401;
      res.body = { error: 'Unauthorized', message: 'Tenant authentication required' };
      return;
    }

    // 2. Module Activation Check
    // Modules are injected into the token/request by the core auth service
    const activeModules = authReq.auth.activeModules || [];
    
    if (!activeModules.includes(moduleId)) {
      console.warn(`[RBAC] Access denied: Module '${moduleId}' not active for tenant '${authReq.auth.tenantId}'`);
      res.status = 403;
      res.body = { 
        error: 'Forbidden', 
        message: `Module '${moduleId}' is not active for this tenant`,
        code: 'MODULE_NOT_ACTIVE'
      };
      return;
    }

    // 3. Proceed
    if (next) await next();
  };
}

/**
 * Tenant Permission Guard Middleware
 * 
 * Ensures that:
 * 1. Request is authenticated
 * 2. User has the specific permission
 */
export function requirePermission(permissionId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    // 1. Basic Auth Check
    if (!authReq.auth || !authReq.auth.tenantId) {
      res.status = 401;
      res.body = { error: 'Unauthorized', message: 'Tenant authentication required' };
      return;
    }

    // 2. Permission Check
    const permissions = authReq.auth.permissions || [];
    
    if (!permissions.includes(permissionId)) {
      console.warn(`[RBAC] Access denied: Missing permission '${permissionId}' for user '${authReq.auth.userId}'`);
      res.status = 403;
      res.body = { 
        error: 'Forbidden', 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
      return;
    }

    // 3. Proceed
    if (next) await next();
  };
}

/**
 * Combined Guard: Module AND Permission
 */
export function requireModuleAndPermission(moduleId: string, permissionId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const moduleMiddleware = requireModule(moduleId);
    const permissionMiddleware = requirePermission(permissionId);

    // Chain middlewares manually
    await moduleMiddleware(req, res, async () => {
      await permissionMiddleware(req, res, next);
    });
  };
}

export function requireFeatureFlag(flagId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.auth || !authReq.auth.tenantId) {
      res.status = 401;
      res.body = { error: 'Unauthorized', message: 'Tenant authentication required' };
      return;
    }

    const enabled = await globalFeatureFlagProvider.isEnabled(flagId, {
      tenantId: authReq.auth.tenantId,
      userId: authReq.auth.userId,
      role: authReq.auth.role,
    });

    if (!enabled) {
      res.status = 403;
      res.body = {
        error: 'Forbidden',
        message: `Feature flag '${flagId}' is disabled`,
        code: 'FEATURE_FLAG_DISABLED',
      };
      return;
    }

    if (next) await next();
  };
}
