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
  type Route,
} from './middleware';
import {
  globalModuleRegistry,
  globalModuleServiceRegistry,
  globalEventBus,
} from '@/src/core';
import type { IDatabaseAdapter, IRepository } from '@/src/core/db/contracts';
import { asModuleId, type ModuleId } from '@/src/core/types';
import type { ModuleContext } from '@/src/core/modules/contracts';
import { HelloService } from '@/src/modules/hello-module/src/services/hello.service';
import ordersModule from '@/src/modules/orders-module/src';
import menuOnlineModule from '@/src/modules/menu-online/src';
import soundNotificationsModule from '@/src/modules/sound-notifications/src';
import settingsModule from '@/src/modules/settings/src';
import checkoutModule from '@/src/modules/checkout/src';
import paymentsModule from '@/src/modules/payments/src';
import financialModule from '@/src/modules/financial/src';

// Tenant Controllers
import * as helloController from './tenant/hello/hello.controller';
import * as tenantWhiteLabelController from './tenant/white-label.controller';

// SaaS Admin Controllers
import * as tenantsController from './saas-admin/tenants.controller';
import * as dashboardController from './saas-admin/dashboard.controller';
import * as plansController from './saas-admin/plans.controller';
import * as modulesController from './saas-admin/modules.controller';
import * as whiteLabelController from './saas-admin/white-label.controller';
import * as auditController from './saas-admin/audit.controller';

// Auth Routes
import { authRoutes } from './auth';
import { tenantRoutes } from './tenant';
import { menuOnlinePublicRoutes } from '@/src/api/v1/tenant/menu-online.routes';
import { checkoutRoutes } from '@/src/modules/checkout/src/checkout.routes';
import { paymentsRoutes } from '@/src/modules/payments/src/payments.routes';
import { financialRoutes } from '@/src/modules/financial/src/financial.routes';

/**
 * API Routes Configuration
 */
export const routes: Route[] = [
  // ==========================================
  // AUTH ROUTES
  // ==========================================
  ...authRoutes,

  ...menuOnlinePublicRoutes,

  ...tenantRoutes,

  ...checkoutRoutes,
  ...paymentsRoutes,
  ...financialRoutes,

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
      requireModule('hello-module'),
      requirePermission('hello.create'),
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
      requireModule('hello-module'),
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
      requireModule('hello-module'),
      requirePermission('hello.read'),
    ],
    handler: helloController.listHellos,
  },

  {
    method: 'GET',
    path: '/api/v1/tenant/white-label',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
    ],
    handler: tenantWhiteLabelController.getTenantWhiteLabel,
  },

  // ==========================================
  // SAAS ADMIN ROUTES
  // ==========================================
  {
    method: 'GET',
    path: '/api/v1/admin/dashboard',
    middlewares: [
      requestLogger,
      errorHandler,
      requireSaaSAdminAuth
    ],
    handler: dashboardController.getDashboard,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/tenants',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.listTenants,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/tenants',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.createTenant,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/tenants/:tenantId',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.getTenant,
  },
  {
    method: 'PATCH',
    path: '/api/v1/admin/tenants/:tenantId/status',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.updateTenantStatus,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/tenants/:tenantId/onboard',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.onboardTenant,
  },
  {
    method: 'PATCH',
    path: '/api/v1/admin/tenants/:tenantId/plan',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.updateTenantPlan,
  },
  {
    method: 'PATCH',
    path: '/api/v1/admin/tenants/:tenantId/modules',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.updateTenantModules,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/tenants/:tenantId/users',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.createTenantAdminUser,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/tenants/:tenantId/modules/:moduleId/activate',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.activateModule,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/tenants/:tenantId/modules/:moduleId/deactivate',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: tenantsController.deactivateModule,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/plans',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: plansController.listPlans,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/plans',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: plansController.createPlan,
  },
  {
    method: 'PATCH',
    path: '/api/v1/admin/plans/:id',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: plansController.updatePlan,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/modules',
    middlewares: [
      requestLogger,
      errorHandler,
      requireSaaSAdminAuth
    ],
    handler: modulesController.listModules,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/white-label/:tenantId',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: whiteLabelController.getWhiteLabel,
  },
  {
    method: 'PATCH',
    path: '/api/v1/admin/white-label/:tenantId',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: whiteLabelController.updateWhiteLabel,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/white-label/:tenantId/init',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: whiteLabelController.initWhiteLabel,
  },
  {
    method: 'GET',
    path: '/api/v1/admin/audit',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth],
    handler: auditController.listAuditLogs,
  },
];

class NullDatabaseAdapter implements IDatabaseAdapter {
  setTenantContext(): void {}

  repository<T>(): IRepository<T> {
    throw new Error('Repository not available in NullDatabaseAdapter');
  }

  async transaction<R>(): Promise<R> {
    throw new Error('Transaction not available in NullDatabaseAdapter');
  }

  async raw<T = unknown>(): Promise<T[]> {
    return [];
  }

  async disconnect(): Promise<void> {}

  async ping(): Promise<boolean> {
    return true;
  }
}

const nullDatabaseAdapter: IDatabaseAdapter = new NullDatabaseAdapter();

const moduleContext: ModuleContext = {
  database: nullDatabaseAdapter,
  eventBus: globalEventBus,
  registerService<T>(moduleId: ModuleId, serviceKey: string, service: T): void {
    globalModuleServiceRegistry.register(moduleId, serviceKey, service);
  },
};

const helloService = new HelloService(moduleContext);

void globalModuleRegistry.register({
  id: asModuleId('hello-module'),
  name: 'Hello Module',
  version: '1.0.0',
  permissions: [],
  eventTypes: [],
  requiredPlan: 'pro',
});

globalModuleServiceRegistry.register(asModuleId('hello-module'), 'HelloService', helloService);

void globalModuleRegistry.register(ordersModule.manifest);
void ordersModule.register(moduleContext);

void globalModuleRegistry.register(menuOnlineModule.manifest);
void menuOnlineModule.register(moduleContext);

void globalModuleRegistry.register(soundNotificationsModule.manifest);
void soundNotificationsModule.register(moduleContext);

void globalModuleRegistry.register(settingsModule.manifest);
void settingsModule.register(moduleContext);

void globalModuleRegistry.register(checkoutModule.manifest);
void checkoutModule.register(moduleContext);

void globalModuleRegistry.register(paymentsModule.manifest);
void paymentsModule.register(moduleContext);

void globalModuleRegistry.register(financialModule.manifest);
void financialModule.register(moduleContext);

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
  const requestPath =
    req.url.length > 1 ? req.url.replace(/\/+$/, '') : req.url;

  // Find matching route
  const route = routes.find((r) => {
    if (r.method !== req.method) return false;
    
    // Simple path matching (can be improved with path-to-regexp)
    const pathPattern = r.path.replace(/:[^/]+/g, '([^/]+)');
    const regex = new RegExp(`^${pathPattern}$`);
    const match = requestPath.match(regex);
    
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
    return {
      status: 404,
      body: { error: 'Not Found', message: 'Route not found' },
    };
  }

  const res: Response = {
    status: 200,
    body: undefined,
  };

  try {
    // Execute middlewares
    await executeMiddlewares(route.middlewares, req, res);
    
    // If middleware didn't set response body, call handler
    if (res.body === undefined) {
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
