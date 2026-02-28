import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { ROLES_PERMISSIONS_PERMISSIONS } from './permissions';
import { ROLES_PERMISSIONS_EVENTS } from './events';

const permissions: ModulePermission[] = Object.values(ROLES_PERMISSIONS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(ROLES_PERMISSIONS_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest = {
  id: asModuleId('roles-permissions'),
  name: 'Perfis e Permissões',
  version: '1.0.0',
  description: 'Gestão de perfis e permissões do sistema',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/roles-permissions',
    homeLabel: 'Perfis e Permissões',
    icon: 'shield',
    category: 'Administração',
  },
  navigation: {
    category: 'pessoas',
    priority: 31,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
