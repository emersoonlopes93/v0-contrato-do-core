import type { Route } from '@/src/api/v1/middleware';
import { ordersTenantRoutes } from './orders.routes';
import { tenantOnboardRoutes } from './onboard.routes';
import { menuOnlineTenantRoutes } from './menu-online.routes';

export const tenantRoutes: Route[] = [
  ...ordersTenantRoutes,
  ...tenantOnboardRoutes,
  ...menuOnlineTenantRoutes,
];
