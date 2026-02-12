import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { RolesPermissionsPage } from '@/src/modules/roles-permissions/src/ui';

export const rolesPermissionsRoutes: TenantModuleRoute[] = [
  {
    path: '/roles-permissions',
    moduleId: asModuleId('roles-permissions'),
    Component: RolesPermissionsPage,
  },
];
