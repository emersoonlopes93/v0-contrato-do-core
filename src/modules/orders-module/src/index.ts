import { manifest } from './manifest';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { ORDERS_PERMISSIONS } from './permissions';
export { ORDERS_EVENTS } from './events';
export type { OrdersPermission } from './permissions';
export type { OrdersEvent, OrderCreatedPayload } from './events';
