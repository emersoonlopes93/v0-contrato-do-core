import { manifest } from './module.config';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { PDV_PERMISSIONS } from './permissions';
export type { PdvPermission } from './permissions';
