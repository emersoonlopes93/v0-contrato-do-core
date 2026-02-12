import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { EmployeesPage } from '@/src/modules/employees/src/ui';

export const employeesRoutes: TenantModuleRoute[] = [
  {
    path: '/employees',
    moduleId: asModuleId('employees'),
    Component: EmployeesPage,
  },
];
