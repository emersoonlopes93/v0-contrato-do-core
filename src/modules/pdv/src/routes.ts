import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { PdvPage } from './pages/PdvPage';

export const pdvRoutes: TenantModuleRoute[] = [
  {
    path: '/pdv',
    moduleId: asModuleId('pdv'),
    Component: PdvPage,
  },
];
