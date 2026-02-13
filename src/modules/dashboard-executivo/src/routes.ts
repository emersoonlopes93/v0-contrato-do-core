import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { DashboardExecutivoPage } from './ui/DashboardExecutivoPage';

export const dashboardExecutivoUiRoutes: TenantModuleRoute[] = [
  {
    path: '/dashboard/executivo',
    moduleId: asModuleId('dashboard-executivo'),
    Component: DashboardExecutivoPage,
  },
];
