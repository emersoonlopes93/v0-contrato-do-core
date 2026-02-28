import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { EMPLOYEES_PERMISSIONS } from './permissions';
import { EMPLOYEES_EVENTS } from './events';

const permissions: ModulePermission[] = Object.values(EMPLOYEES_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(EMPLOYEES_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest = {
  id: asModuleId('employees'),
  name: 'Funcionários',
  version: '1.0.0',
  description: 'Gestão de funcionários do tenant',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/employees',
    homeLabel: 'Funcionários',
    icon: 'users',
    category: 'Administração',
  },
  navigation: {
    category: 'pessoas',
    priority: 30,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
