import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { KDS_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(KDS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('kds'),
  name: 'KDS',
  description: 'Kitchen Display System',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/kds',
    homeLabel: 'KDS',
    icon: 'chef-hat',
    category: 'Operação',
  },
  navigation: {
    category: 'operacao',
    priority: 2,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
