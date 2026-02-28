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
  uiEntry: {
    tenantBasePath: '/payments',
    homeLabel: 'Pagamentos',
    icon: 'credit-card',
    category: 'Integrações',
  },
  navigation: {
    category: 'integracoes',
    priority: 40,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'integrations',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
};
