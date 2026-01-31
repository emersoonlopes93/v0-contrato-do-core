import { manifest } from './manifest';
import { register } from './module';

export default {
  manifest,
  register,
};

// Named exports for convenience
export { manifest, register };
export { PERMISSIONS } from './permissions';
export { EVENTS } from './events';
export type { HelloPermission } from './permissions';
export type { HelloEvent, HelloCreatedPayload, HelloGreetedPayload } from './events';
