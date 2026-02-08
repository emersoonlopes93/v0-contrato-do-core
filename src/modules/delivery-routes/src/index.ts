import { manifest } from './manifest';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { DELIVERY_ROUTES_PERMISSIONS } from './permissions';
export { DELIVERY_ROUTES_EVENTS } from './events';
export type { DeliveryRoutesPermission } from './permissions';
export type { DeliveryRoutesEvent } from './events';
