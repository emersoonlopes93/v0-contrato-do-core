import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DeliveryTrackingPage } from './ui/DeliveryTrackingPage';

export const deliveryTrackingRoutes: TenantModuleRoute[] = [
  {
    path: '/delivery-tracking',
    moduleId: asModuleId('delivery-tracking'),
    Component: DeliveryTrackingPage,
  },
];

