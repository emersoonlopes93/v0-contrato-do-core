import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { CashierPage } from './pages/CashierPage';

export const cashierRoutes: TenantModuleRoute[] = [
  {
    path: '/cashier',
    moduleId: asModuleId('cashier'),
    Component: CashierPage,
  },
];
