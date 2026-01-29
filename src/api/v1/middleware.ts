/**
 * API Middleware
 * 
 * Thin middleware layer for HTTP handling.
 * Does NOT contain business logic.
 */

import { AuthGuards, type GuardContext } from '../../core/auth/guards';

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
  headers?: Record<string, string>;
}

export type NextFunction = () => Promise<void>;
export type Middleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const guards = new AuthGuards();

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return undefined;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return undefined;
  }
  
  return parts[1];
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
    (req as any).auth = {
      userId: result.token.userId,
      tenantId: result.tenantId,
      role: result.token.role,
      permissions: result.token.permissions,
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
    (req as any).auth = {
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
      const result = await guards.requireModule(context, moduleId as any);
      
      // Update request auth
      (req as any).auth = {
        userId: result.token.userId,
        tenantId: result.tenantId,
        role: result.token.role,
        permissions: result.token.permissions,
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
      const result = await guards.requirePermission(context, permission);
      
      // Update request auth
      (req as any).auth = {
        userId: result.token.userId,
        tenantId: result.tenantId,
        role: result.token.role,
        permissions: result.token.permissions,
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
