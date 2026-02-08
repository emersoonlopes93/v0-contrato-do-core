import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DeliveryRoutesPage } from './ui/DeliveryRoutesPage';

export const deliveryRoutes: TenantModuleRoute[] = [
  {
    path: '/delivery-routes',
    moduleId: asModuleId('delivery-routes'),
    Component: DeliveryRoutesPage,
  },
];
