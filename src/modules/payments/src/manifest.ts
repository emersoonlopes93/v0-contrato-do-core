import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { PAYMENTS_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(PAYMENTS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('payments'),
  name: 'Payments',
  version: '1.0.0',
  permissions,
  eventTypes,
  requiredPlan: 'pro',
};

