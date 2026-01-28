import type { ModuleManifest } from '../../../core/modules/contracts';
import { PERMISSIONS } from './permissions';
import { EVENTS } from './events';

export const manifest: ModuleManifest = {
  id: 'hello-module',
  name: 'Hello Module',
  version: '1.0.0',
  permissions: Object.values(PERMISSIONS),
  eventsEmitted: Object.values(EVENTS),
};
