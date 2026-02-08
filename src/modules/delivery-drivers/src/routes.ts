import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DeliveryDriversPage } from './ui/DeliveryDriversPage';

export const deliveryDriversRoutes: TenantModuleRoute[] = [
  {
    path: '/delivery-drivers',
    moduleId: asModuleId('delivery-drivers'),
    Component: DeliveryDriversPage,
  },
];
