import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DELIVERY_SETTLEMENT_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DELIVERY_SETTLEMENT_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('delivery-settlement'),
  name: 'Repasse de Entrega',
  description: 'Cálculo automático de split financeiro entre entregador, loja e plataforma',
  version: '1.0.0',
  requiredPlan: 'pro',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/delivery-settlement',
    homeLabel: 'Repasse de Entrega',
    icon: 'calculator',
    category: 'Financeiro / Logística',
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
