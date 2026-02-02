import type {
  ModuleEventType,
  ModulePermission,
  ModuleRegisterPayload,
} from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { CHECKOUT_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(CHECKOUT_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('checkout'),
  name: 'Checkout',
  version: '1.0.0',
  permissions,
  eventTypes,
  requiredPlan: 'pro',
};

