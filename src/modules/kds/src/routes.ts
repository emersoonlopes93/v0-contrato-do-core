import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { KdsPage } from './pages/KdsPage';

export const kdsRoutes: TenantModuleRoute[] = [
  {
    path: '/kds',
    moduleId: asModuleId('kds'),
    Component: KdsPage,
  },
];
