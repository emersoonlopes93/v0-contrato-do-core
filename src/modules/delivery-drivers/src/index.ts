import { manifest } from './manifest';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { DELIVERY_DRIVERS_PERMISSIONS } from './permissions';
export { DELIVERY_DRIVERS_EVENTS } from './events';
export type { DeliveryDriversPermission } from './permissions';
export type { DeliveryDriversEvent } from './events';
