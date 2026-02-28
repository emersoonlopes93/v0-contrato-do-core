import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DELIVERY_TRACKING_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DELIVERY_TRACKING_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('delivery-tracking'),
  name: 'Mapa de Entregas',
  description: 'Visualização em mapa de entregadores e rotas de entrega',
  version: '1.0.0',
  requiredPlan: 'pro',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/delivery-tracking',
    homeLabel: 'Mapa de Entregas',
    icon: 'map',
    category: 'Entregas',
  },
  navigation: {
    category: 'entregas',
    priority: 11,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
