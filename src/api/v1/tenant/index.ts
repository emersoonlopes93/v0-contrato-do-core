import type { Route } from '@/src/api/v1/middleware';
import { ordersTenantRoutes } from './orders.routes';
import { tenantOnboardRoutes } from './onboard.routes';
import { menuOnlineTenantRoutes } from './menu-online.routes';
import { soundNotificationsTenantRoutes } from './sound-notifications.routes';
import { storeSettingsTenantRoutes } from '@/src/modules/store-settings/src/store-settings.routes';
import { tenantSettingsTenantRoutes } from '@/src/modules/settings/src/tenant-settings.routes';

export const tenantRoutes: Route[] = [
  ...ordersTenantRoutes,
  ...tenantOnboardRoutes,
  ...storeSettingsTenantRoutes,
  ...tenantSettingsTenantRoutes,
  ...menuOnlineTenantRoutes,
  ...soundNotificationsTenantRoutes,
];
