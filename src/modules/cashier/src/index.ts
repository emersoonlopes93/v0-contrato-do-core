import { manifest } from './module.config';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { CASHIER_PERMISSIONS } from './permissions';
export type { CashierPermission } from './permissions';
