/**
 * Auth Routes
 * 
 * Public API routes for authentication.
 */

import { requestLogger, errorHandler, type Route } from '../middleware';
import * as saasAuthController from './saas-admin-auth.controller';
import * as tenantAuthController from './tenant-auth.controller';
import * as sessionController from './session.controller';

export const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/auth/saas-admin/login',
    middlewares: [requestLogger, errorHandler],
    handler: saasAuthController.saasAdminLogin,
  },
  {
    method: 'POST',
    path: '/api/v1/auth/tenant/login',
    middlewares: [requestLogger, errorHandler],
    handler: tenantAuthController.tenantLogin,
  },
  {
    method: 'GET',
    path: '/api/v1/auth/session',
    middlewares: [requestLogger, errorHandler],
    handler: sessionController.getSession,
  },
];
