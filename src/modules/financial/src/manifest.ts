import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { FINANCIAL_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(FINANCIAL_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('financial'),
  name: 'Financeiro',
  version: '1.0.0',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/financial',
    homeLabel: 'Financeiro',
    icon: 'wallet',
    category: 'Financeiro',
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
};
