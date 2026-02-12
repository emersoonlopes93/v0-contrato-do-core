/**
 * API Middleware
 * 
 * Thin middleware layer for HTTP handling.
 * Does NOT contain business logic.
 */

import { AuthGuards, type GuardContext } from '../../core/auth/guards';
import { asModuleId } from '@/core/types';
import { AuthRepository } from '@/src/adapters/prisma/repositories/auth-repository';

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
const authRepo = new AuthRepository();

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
      
      await next();
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
      const result = await guards.requireTenantUser(context);
      const permissions = await authRepo.getTenantUserPermissions(result.token.userId, result.tenantId);

      if (!permissions.includes(permission)) {
        throw new Error(`Permission denied: ${permission} required`);
      }
      
      // Update request auth
      (req as AuthenticatedRequest).auth = {
        userId: result.token.userId,
        tenantId: result.tenantId,
        role: result.token.role,
        permissions,
        activeModules: result.token.activeModules.map((m) => m.toString()),
      };
      
      await next();
    } catch (error) {
      res.status = 403;
      res.body = {
        error: 'Forbidden',
        message: error instanceof Error ? error.message : 'Permission denied',
      };
    }
  };
}

/**
 * Error handler middleware
 */
export const errorHandler: Middleware = async (req, res, next) => {
  try {
    await next();
  } catch (error) {
    console.error('[v0] API Error:', error);
    
    res.status = res.status || 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

/**
 * Request logger middleware
 */
export const requestLogger: Middleware = async (req, res, next) => {
  const start = Date.now();
  console.log(`[v0] ${req.method} ${req.url} - Start`);
  
  await next();
  
  const duration = Date.now() - start;
  console.log(`[v0] ${req.method} ${req.url} - ${res.status} (${duration}ms)`);
};
