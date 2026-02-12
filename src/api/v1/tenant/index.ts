import type { Route } from '@/src/api/v1/middleware';
import { ordersTenantRoutes } from './orders.routes';
import { tenantOnboardRoutes } from './onboard.routes';
import { menuOnlineTenantRoutes } from './menu-online.routes';
import { soundNotificationsTenantRoutes } from './sound-notifications.routes';
import { storeSettingsTenantRoutes } from '@/src/modules/store-settings/src/store-settings.routes';
import { tenantSettingsTenantRoutes } from '@/src/modules/settings/src/tenant-settings.routes';
import { deliveryRoutesTenantRoutes } from '@/src/modules/delivery-routes/src/delivery-routes.routes';
import { deliveryTrackingTenantRoutes } from '@/src/modules/delivery-tracking/src/delivery-tracking.routes';
import { deliveryPricingTenantRoutes } from '@/src/modules/delivery-pricing/src/delivery-pricing.routes';
import { employeesTenantRoutes } from '@/src/modules/employees/src/employees.routes';
import { rolesPermissionsTenantRoutes } from '@/src/modules/roles-permissions/src/roles-permissions.routes';

export const tenantRoutes: Route[] = [
  ...ordersTenantRoutes,
  ...tenantOnboardRoutes,
  ...storeSettingsTenantRoutes,
  ...tenantSettingsTenantRoutes,
  ...menuOnlineTenantRoutes,
  ...soundNotificationsTenantRoutes,
  ...deliveryRoutesTenantRoutes,
  ...deliveryTrackingTenantRoutes,
  ...deliveryPricingTenantRoutes,
  ...employeesTenantRoutes,
  ...rolesPermissionsTenantRoutes,
];
