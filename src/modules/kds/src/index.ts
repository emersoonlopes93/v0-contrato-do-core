import { manifest } from './module.config';
import { register } from './module';

export default {
  manifest,
  register,
};

export { manifest, register };
export { KDS_PERMISSIONS } from './permissions';
export type { KdsPermission } from './permissions';
