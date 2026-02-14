/**
 * API Middleware
 * 
 * Thin middleware layer for HTTP handling.
 * Does NOT contain business logic.
 */

import { AuthGuards, type GuardContext } from '../../core/auth/guards';
import { asModuleId } from '@/core/types';
import { runWithTenant } from '@/src/core/context/async-context';

export interface Request {
  headers: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  method: string;
  url: string;
}

export interface Response {
  status: number;
  body: unknown;
  headers?: Record<string, string | string[]>;
}

export type NextFunction = () => Promise<void>;
export type Middleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

interface AuthContext {
  userId: string;
  role: string;
  tenantId?: string;
  permissions?: string[];
  activeModules?: string[];
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  middlewares: Middleware[];
  handler: (req: Request, res: Response) => Promise<void>;
}

const guards = new AuthGuards();


/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    const cookieHeader = req.headers['cookie'];
    if (!cookieHeader || typeof cookieHeader !== 'string') return undefined;
    const authContext = req.headers['x-auth-context'];
    const context = typeof authContext === 'string' ? authContext : null;

    if (context === 'saas_admin') {
      const token = parseCookieValue(cookieHeader, 'saas_auth_token');
      return token ?? undefined;
    }

    if (context === 'tenant_user') {
      const token = parseCookieValue(cookieHeader, 'tenant_auth_token');
      return token ?? undefined;
    }

    const saasToken = parseCookieValue(cookieHeader, 'saas_auth_token');
    if (saasToken) return saasToken;
    const tenantToken = parseCookieValue(cookieHeader, 'tenant_auth_token');
    return tenantToken ?? undefined;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return undefined;
  }
  
  return parts[1];
}

function parseCookieValue(cookieHeader: string, key: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${key}=`)) continue;
    const value = trimmed.slice(key.length + 1);
    return value.length > 0 ? value : null;
  }
  return null;
}

/**
 * Build GuardContext from Request
 */
function buildGuardContext(req: Request): GuardContext {
  return {
    token: extractToken(req),
    headers: req.headers,
    subdomain: req.headers['x-tenant-subdomain'],
    pathParams: req.params,
  };
}

/**
 * Require Tenant User authentication
 */
export const requireTenantAuth: Middleware = async (req, res, next) => {
  try {
    const context = buildGuardContext(req);
    const result = await guards.requireTenantUser(context);
    
    // Attach to request for controllers
    (req as AuthenticatedRequest).auth = {
      userId: result.token.userId,
      tenantId: result.tenantId,
      role: result.token.role,
      permissions: result.token.permissions,
      activeModules: result.token.activeModules.map((m) => m.toString()),
    };
    
    // Wrap next execution in tenant context
    await runWithTenant(result.tenantId, async () => {
      await next();
    });
  } catch (error) {
    res.status = 401;
    res.body = {
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
};

/**
 * Require SaaS Admin authentication
 */
export const requireSaaSAdminAuth: Middleware = async (req, res, next) => {
  try {
    const context = buildGuardContext(req);
    const result = await guards.requireSaaSAdmin(context);
    
    // Attach to request for controllers
    (req as AuthenticatedRequest).auth = {
      userId: result.token.userId,
      role: result.token.role,
    };
    
    await next();
  } catch (error) {
    res.status = 401;
    res.body = {
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
};

/**
 * Require specific module to be enabled
 */
export function requireModule(moduleId: string): Middleware {
  return async (req, res, next) => {
    try {
      const context = buildGuardContext(req);
      const result = await guards.requireModule(
        context,
        asModuleId(moduleId),
      );
      
      // Update request auth
      (req as AuthenticatedRequest).auth = {
        userId: result.token.userId,
        tenantId: result.tenantId,
        role: result.token.role,
        permissions: result.token.permissions,
        activeModules: result.token.activeModules.map((m) => m.toString()),
      };
      
      // Ensure context is applied if requireTenantAuth wasn't called or failed to wrap?
      // Since middleware chain is sequential, if requireTenantAuth was called, we are already inside runWithTenant.
      // But if requireModule is called standalone (unlikely but possible), we should wrap it.
      // However, wrapping inside wrapping might be redundant but safe with AsyncLocalStorage.
      // The issue is if we wrap here, we might be nesting contexts.
      // AsyncLocalStorage handles nesting fine (inner context overrides outer).
      // Since tenantId should be same, it's fine.
      
      await runWithTenant(result.tenantId, async () => {
        await next();
      });

    } catch (error) {
      res.status = 403;
      res.body = {
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Module access denied',
      };
    }
  };
}

/**
 * Require specific permission
 */
export function requirePermission(permission: string): Middleware {
  return async (req, res, next) => {
    try {
      const context = buildGuardContext(req);
      const result = await guards.requirePermission(
        context,
        permission,
      );
      
      // Update request auth
      (req as AuthenticatedRequest).auth = {
        userId: result.token.userId,
        tenantId: result.tenantId,
        role: result.token.role,
        permissions: result.token.permissions,
        activeModules: result.token.activeModules.map((m) => m.toString()),
      };

      await runWithTenant(result.tenantId, async () => {
        await next();
      });

    } catch (error) {
      res.status = 403;
      res.body = {
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Permission denied',
      };
    }
  };
}

export function requestLogger(req: Request, res: Response, next: NextFunction): Promise<void> {
    // console.log(`${req.method} ${req.url}`);
    return next();
}

export function errorHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    return next().catch(err => {
        console.error(err);
        res.status = 500;
        res.body = { error: 'Internal Server Error', message: err.message };
    });
}
