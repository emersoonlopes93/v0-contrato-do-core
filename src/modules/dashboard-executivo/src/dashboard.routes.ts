import {
  errorHandler,
  requireModule,
  requirePermission,
  requireTenantAuth,
  requestLogger,
  type Route,
} from '@/src/api/v1/middleware';
import { handleGetExecutiveDashboard } from './presentation/controllers/dashboard.controller';

export const dashboardExecutivoRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/dashboard/executivo',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('dashboard-executivo'),
      requirePermission('dashboard-executivo.view'),
    ],
    handler: handleGetExecutiveDashboard,
  },
];
