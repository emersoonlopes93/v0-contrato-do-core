import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';

const permissions: ModulePermission[] = [];

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('designer-menu'),
  name: 'Designer do Cardápio',
  description: 'Personalização visual do cardápio público',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/designer-menu',
    homeLabel: 'Designer do Cardápio',
    icon: 'palette',
    category: 'Cardápio',
  },
  navigation: {
    category: 'experiencia',
    priority: 60,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'visual',
  scope: 'public-menu',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
