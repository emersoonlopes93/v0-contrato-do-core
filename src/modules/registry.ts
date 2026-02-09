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
import { kdsRoutes } from '@/src/modules/kds/src/routes';
import { pdvRoutes } from '@/src/modules/pdv/src/routes';
import { cashierRoutes } from '@/src/modules/cashier/src/routes';
import { deliveryDriversRoutes } from '@/src/modules/delivery-drivers/src/routes';
import { deliveryRoutes } from '@/src/modules/delivery-routes/src/routes';
import { deliveryTrackingRoutes } from '@/src/modules/delivery-tracking/src/routes';
import { deliveryPricingRoutes } from '@/src/modules/delivery-pricing/src/routes';

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
];
