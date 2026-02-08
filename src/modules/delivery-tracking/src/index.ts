import { manifest } from './manifest';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { DELIVERY_TRACKING_PERMISSIONS } from './permissions';
export type { DeliveryTrackingPermission } from './permissions';
