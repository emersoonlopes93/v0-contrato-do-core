import type {
  ModuleEventType,
  ModulePermission,
  ModuleRegisterPayload,
} from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { ORDERS_PERMISSIONS } from './permissions';
import { ORDERS_EVENTS } from './events';

const permissions: ModulePermission[] = Object.values(ORDERS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(ORDERS_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('orders-module'),
  name: 'Orders Module',
  version: '1.0.0',
  permissions,
  eventTypes,
  requiredPlan: 'pro',
};
