import type {
  ModuleEventType,
  ModulePermission,
  ModuleRegisterPayload,
} from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { SOUND_NOTIFICATION_EVENTS } from '@/src/types/sound-notifications';
import { SOUND_NOTIFICATIONS_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(SOUND_NOTIFICATIONS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(SOUND_NOTIFICATION_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('sound-notifications'),
  name: 'Sound Notifications',
  version: '1.0.0',
  permissions,
  eventTypes,
  requiredPlan: 'pro',
};
