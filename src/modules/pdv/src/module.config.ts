import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { PDV_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(PDV_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('pdv'),
  name: 'PDV',
  description: 'Ponto de Venda',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/pdv',
    homeLabel: 'PDV',
    icon: 'shopping-cart',
    category: 'Operação',
  },
  navigation: {
    category: 'operacao',
    priority: 3,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
