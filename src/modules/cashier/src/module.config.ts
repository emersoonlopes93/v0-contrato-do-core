import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { CASHIER_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(CASHIER_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('cashier'),
  name: 'Caixa',
  description: 'Controle operacional de caixa',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/cashier',
    homeLabel: 'Caixa',
    icon: 'wallet',
    category: 'Operação',
  },
  navigation: {
    category: 'operacao',
    priority: 4,
    modes: ['essential', 'professional'],
  },
  type: 'operations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
