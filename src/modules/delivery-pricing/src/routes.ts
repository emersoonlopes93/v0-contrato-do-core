import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DeliveryPricingPage } from './ui/DeliveryPricingPage';

export const deliveryPricingRoutes: TenantModuleRoute[] = [
  {
    path: '/delivery-pricing',
    moduleId: asModuleId('delivery-pricing'),
    Component: DeliveryPricingPage,
  },
];
