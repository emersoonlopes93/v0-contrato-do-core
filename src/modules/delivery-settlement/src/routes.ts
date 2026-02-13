import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DeliverySettlementSettingsPage } from './ui/DeliverySettlementSettingsPage';
import { DeliverySettlementHistoryPage } from './ui/DeliverySettlementHistoryPage';
import { DeliverySettlementDetailPage } from './ui/DeliverySettlementDetailPage';

export const deliverySettlementRoutes: TenantModuleRoute[] = [
  {
    path: '/delivery-settlement',
    moduleId: asModuleId('delivery-settlement'),
    Component: DeliverySettlementSettingsPage,
  },
  {
    path: '/delivery-settlement/history',
    moduleId: asModuleId('delivery-settlement'),
    Component: DeliverySettlementHistoryPage,
  },
  {
    path: '/delivery-settlement/:orderId',
    moduleId: asModuleId('delivery-settlement'),
    Component: DeliverySettlementDetailPage,
  },
];
