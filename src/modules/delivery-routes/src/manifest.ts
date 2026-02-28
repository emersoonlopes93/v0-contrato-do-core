import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DELIVERY_ROUTES_EVENTS } from './events';
import { DELIVERY_ROUTES_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DELIVERY_ROUTES_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(DELIVERY_ROUTES_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest = {
  id: asModuleId('delivery-routes'),
  name: 'Roteirização',
  description: 'Agrupamento e otimização de rotas de entrega',
  version: '1.0.0',
  requiredPlan: 'pro',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/delivery-routes',
    homeLabel: 'Roteirização',
    icon: 'settings',
    category: 'Entregas',
  },
  navigation: {
    category: 'entregas',
    priority: 12,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
