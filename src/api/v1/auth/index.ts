/**
 * Auth Routes
 * 
 * Public API routes for authentication.
 */

import { requestLogger, errorHandler, type Route } from '../middleware';
import * as saasAuthController from './saas-admin-auth.controller';
import * as tenantAuthController from './tenant-auth.controller';
import * as globalTenantAuthController from './global-tenant-auth.controller';
import * as sessionController from './session.controller';
import * as publicAuthController from './public-auth.controller';

export const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/saas-admin/login',
    middlewares: [requestLogger, errorHandler],
    handler: saasAuthController.saasAdminLogin,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/saas-admin/mfa/verify',
    middlewares: [requestLogger, errorHandler],
    handler: saasAuthController.saasAdminMfaVerify,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/saas-admin/refresh',
    middlewares: [requestLogger, errorHandler],
    handler: saasAuthController.saasAdminRefresh,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/tenant/login',
    middlewares: [requestLogger, errorHandler],
    handler: tenantAuthController.tenantLogin,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/tenant/refresh',
    middlewares: [requestLogger, errorHandler],
    handler: tenantAuthController.tenantRefresh,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    middlewares: [requestLogger, errorHandler],
    handler: globalTenantAuthController.tenantGlobalLogin,
  },
  {
    method: 'GET',
    path: '/api/v1/auth/session',
    middlewares: [requestLogger, errorHandler],
    handler: sessionController.getSession,
  },
  {
    method: 'POST',
    path: '/api/v1/public/signup',
    middlewares: [requestLogger, errorHandler],
    handler: publicAuthController.publicSignup,
  },
  {
    method: 'POST',
    path: '/api/v1/public/login',
    middlewares: [requestLogger, errorHandler],
    handler: globalTenantAuthController.tenantGlobalLogin,
  },
];
