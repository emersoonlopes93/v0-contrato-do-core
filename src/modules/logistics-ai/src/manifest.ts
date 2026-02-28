import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { LOGISTICS_AI_EVENTS } from './events';
import { LOGISTICS_AI_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(LOGISTICS_AI_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = Object.values(LOGISTICS_AI_EVENTS).map((id) => ({
  id,
  name: id,
  description: id,
}));

export const manifest = {
  id: asModuleId('logistics-ai'),
  name: 'IA Logística',
  description: 'Inteligência operacional para previsão de atrasos e otimização de rotas',
  version: '1.0.0',
  requiredPlan: 'pro',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/logistics-ai',
    homeLabel: 'IA Logística',
    icon: 'brain',
    category: 'Logística Avançada',
  },
  navigation: {
    category: 'entregas',
    priority: 15,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
