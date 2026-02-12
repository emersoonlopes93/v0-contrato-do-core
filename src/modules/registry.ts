import type { ComponentType } from 'react';
import type { ModuleRegisterPayload } from '@/src/core/modules/contracts';
import type { ModuleId } from '@/src/core/types';
import { globalModuleRegistry } from '@/src/core/modules/registry';
import { manifest as ordersManifest } from '@/src/modules/orders-module/src/manifest';
import { manifest as menuOnlineManifest } from '@/src/modules/menu-online/src/manifest';
import { manifest as soundNotificationsManifest } from '@/src/modules/sound-notifications/src/manifest';
import { manifest as storeSettingsManifest } from '@/src/modules/store-settings/src/manifest';
import { manifest as paymentsManifest } from '@/src/modules/payments/src/manifest';
import { manifest as financialManifest } from '@/src/modules/financial/src/manifest';
import { manifest as designerMenuManifest } from '@/src/modules/designer-menu/src/manifest';
import { manifest as kdsManifest } from '@/src/modules/kds/src/module.config';
import { manifest as pdvManifest } from '@/src/modules/pdv/src/module.config';
import { manifest as cashierManifest } from '@/src/modules/cashier/src/module.config';
import { manifest as deliveryDriversManifest } from '@/src/modules/delivery-drivers/src/manifest';
import { manifest as deliveryRoutesManifest } from '@/src/modules/delivery-routes/src/manifest';
import { manifest as deliveryTrackingManifest } from '@/src/modules/delivery-tracking/src/manifest';
import { manifest as deliveryPricingManifest } from '@/src/modules/delivery-pricing/src/manifest';
import { manifest as deliverySettlementManifest } from '@/src/modules/delivery-settlement/src/manifest';
import { manifest as logisticsAiManifest } from '@/src/modules/logistics-ai/src/manifest';
import { manifest as employeesManifest } from '@/src/modules/employees/src/manifest';
import { manifest as rolesPermissionsManifest } from '@/src/modules/roles-permissions/src/manifest';
import { manifest as customersCrmManifest } from './customers-crm/src/manifest';
import { kdsRoutes } from './kds/src/routes';
import { pdvRoutes } from './pdv/src/routes';
import { cashierRoutes } from './cashier/src/routes';
import { deliveryDriversRoutes } from './delivery-drivers/src/routes';
import { deliveryRoutes } from './delivery-routes/src/routes';
import { deliveryTrackingRoutes } from './delivery-tracking/src/routes';
import { deliveryPricingRoutes } from './delivery-pricing/src/routes';
import { deliverySettlementRoutes } from './delivery-settlement/src/routes';
import { logisticsAiRoutes } from './logistics-ai/src/routes';
import { employeesRoutes } from './employees/src/routes';
import { rolesPermissionsRoutes } from './roles-permissions/src/routes';
import { customersCrmRoutes } from './customers-crm/src/routes';

export type TenantModuleRoute = {
  path: string;
  moduleId: ModuleId;
  Component: ComponentType;
};

const uiManifests: ModuleRegisterPayload[] = [
  ordersManifest,
  menuOnlineManifest,
  soundNotificationsManifest,
  storeSettingsManifest,
  paymentsManifest,
  financialManifest,
  designerMenuManifest,
  kdsManifest,
  pdvManifest,
  cashierManifest,
  deliveryDriversManifest,
  deliveryRoutesManifest,
  deliveryTrackingManifest,
  deliveryPricingManifest,
  deliverySettlementManifest,
  logisticsAiManifest,
  employeesManifest,
  rolesPermissionsManifest,
  customersCrmManifest,
];

let uiRegistryReady = false;

export async function ensureTenantUiRegistry(): Promise<void> {
  if (uiRegistryReady) return;
  uiRegistryReady = true;
  await Promise.all(uiManifests.map((manifest) => globalModuleRegistry.register(manifest)));
}

export async function listTenantUiModules(): Promise<ModuleRegisterPayload[]> {
  await ensureTenantUiRegistry();
  const modules = await globalModuleRegistry.listRegisteredModules();
  return modules.filter((module) => module.uiEntry);
}

export const tenantModuleRoutes: TenantModuleRoute[] = [
  ...kdsRoutes,
  ...pdvRoutes,
  ...cashierRoutes,
  ...deliveryDriversRoutes,
  ...deliveryRoutes,
  ...deliveryTrackingRoutes,
  ...deliveryPricingRoutes,
  ...deliverySettlementRoutes,
  ...logisticsAiRoutes,
  ...employeesRoutes,
  ...rolesPermissionsRoutes,
  ...customersCrmRoutes,
];
