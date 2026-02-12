import { CustomersCRMPage } from './ui/CustomersCRMPage';
import { CustomerDetailsPage } from './ui/CustomerDetailsPage';
import type { TenantModuleRoute } from '@/src/modules/registry';
import type { ComponentType } from 'react';
import { asModuleId } from '@/src/core/types';

export const customersCrmRoutes: TenantModuleRoute[] = [
  {
    path: '/crm',
    moduleId: asModuleId('customers-crm'),
    Component: CustomersCRMPage,
  },
  {
    path: '/crm/[id]',
    moduleId: asModuleId('customers-crm'),
    Component: CustomerDetailsPage,
  },
];
