/**
 * API v1 Router
 * 
 * Central routing configuration.
 * Maps HTTP paths to controllers with middleware.
 */

import {
  requireTenantAuth,
  requireSaaSAdminAuth,
  requireModule,
  requirePermission,
  errorHandler,
  requestLogger,
  type Request,
  type Response,
  type Middleware,
} from './middleware';

// Tenant Controllers
import * as helloController from './tenant/hello/hello.controller';

// SaaS Admin Controllers
import * as tenantsController from './saas-admin/tenants.controller';

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  middlewares: Middleware[];
  handler: (req: Request, res: Response) => Promise<void>;
}

/**
 * API Routes Configuration
 */
export const routes: Route[] = [
  // ==========================================
  // TENANT ROUTES - Hello Module
  // ==========================================
  {
    method: 'POST',
    path: '/api/v1/tenant/hello/create',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('hello'),
      requirePermission('hello.write'),
    ],
    handler: helloController.createHello,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/hello/greet',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('hello'),
      requirePermission('hello.read'),
    ],
    handler: helloController.greet,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/hello/list',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('hello'),
      requirePermission('hello.read'),
    ],
    handler: helloController.listHellos,
  },

  // ==========================================
  // SAAS ADMIN ROUTES
  // ==========================================
  {
    method: 'GET',
    path: '/api/v1/saas-admin/tenants',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.listTenants,
  },
  {
    method: 'GET',
    path: '/api/v1/saas-admin/tenants/:tenantId',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.getTenant,
  },
  {
    method: 'POST',
    path: '/api/v1/saas-admin/tenants/:tenantId/modules/:moduleId/activate',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.activateModule,
  },
  {
    method: 'POST',
    path: '/api/v1/saas-admin/tenants/:tenantId/modules/:moduleId/deactivate',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.deactivateModule,
  },
];

/**
 * Execute middleware chain
 */
async function executeMiddlewares(
  middlewares: Middleware[],
  req: Request,
  res: Response
): Promise<void> {
  let index = 0;

  const next = async (): Promise<void> => {
    if (index >= middlewares.length) {
      return;
    }

    const middleware = middlewares[index];
    index++;

    await middleware(req, res, next);
  };

  await next();
}

/**
 * Handle API request
 */
export async function handleRequest(req: Request): Promise<Response> {
  const res: Response = {
    status: 404,
    body: { error: 'Not Found', message: 'Route not found' },
  };

  // Find matching route
  const route = routes.find((r) => {
    if (r.method !== req.method) return false;
    
    // Simple path matching (can be improved with path-to-regexp)
    const pathPattern = r.path.replace(/:[^/]+/g, '([^/]+)');
    const regex = new RegExp(`^${pathPattern}$`);
    const match = req.url.match(regex);
    
    if (match) {
      // Extract path params
      const paramNames = (r.path.match(/:[^/]+/g) || []).map((p) => p.slice(1));
      req.params = {};
      paramNames.forEach((name, i) => {
        req.params![name] = match[i + 1];
      });
      return true;
    }
    
    return false;
  });

  if (!route) {
    return res;
  }

  try {
    // Execute middlewares
    await executeMiddlewares(route.middlewares, req, res);
    
    // If middleware didn't set response, call handler
    if (!res.body || (res.body as any).error === undefined) {
      await route.handler(req, res);
    }
  } catch (error) {
    console.error('[v0] handleRequest error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }

  return res;
}
