import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DELIVERY_PRICING_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DELIVERY_PRICING_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('delivery-pricing'),
  name: 'Precificação de Entrega',
  description: 'Cálculo automático de taxa de entrega por KM e regras dinâmicas',
  version: '1.0.0',
  requiredPlan: 'pro',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/delivery-pricing',
    homeLabel: 'Precificação de Entrega',
    icon: 'calculator',
    category: 'Logística / Financeiro',
  },
  navigation: {
    category: 'entregas',
    priority: 13,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
