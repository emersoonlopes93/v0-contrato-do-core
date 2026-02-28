import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';

const permissions: ModulePermission[] = [];
const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('delivery-driver-app'),
  name: 'App do Entregador',
  description: 'Aplicativo operacional do entregador com GPS em tempo real',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  navigation: {
    category: 'entregas',
    priority: 16,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'driver-app',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: false,
} satisfies ModuleRegisterPayload;
