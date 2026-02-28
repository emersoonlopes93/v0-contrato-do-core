import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DELIVERY_DRIVERS_EVENTS } from './events';
import { DELIVERY_DRIVERS_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DELIVERY_DRIVERS_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(DELIVERY_DRIVERS_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest = {
  id: asModuleId('delivery-drivers'),
  name: 'Entregadores',
  description: 'Gestão operacional de entregadores e status de entrega',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/delivery-drivers',
    homeLabel: 'Entregadores',
    icon: 'box',
    category: 'Entregas',
  },
  navigation: {
    category: 'entregas',
    priority: 10,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
