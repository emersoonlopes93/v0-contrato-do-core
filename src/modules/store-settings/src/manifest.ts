import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { STORE_SETTINGS_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(STORE_SETTINGS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('store-settings'),
  name: 'Store Settings',
  description: 'Configurações obrigatórias do restaurante',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
} satisfies ModuleRegisterPayload;

