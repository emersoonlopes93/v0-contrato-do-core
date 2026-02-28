import type { ModuleRegisterPayload, ModulePermission, ModuleEventType } from '../../../core/modules/contracts';
import { asModuleId } from '../../../core/types';
import { PERMISSIONS } from './permissions';
import { EVENTS } from './events';

const permissions: ModulePermission[] = Object.values(PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('hello-module'),
  name: 'Hello Module',
  version: '1.0.0',
  permissions,
  eventTypes,
  navigation: {
    category: 'operacao',
    priority: 90,
    modes: ['professional'],
    isAdvanced: true,
  },
};
