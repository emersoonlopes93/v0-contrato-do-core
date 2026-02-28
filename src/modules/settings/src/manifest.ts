import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';

const permissions: ModulePermission[] = [];
const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('settings'),
  name: 'Settings',
  description: 'Configurações operacionais do tenant',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  navigation: {
    category: 'configuracoes',
    priority: 52,
    modes: ['essential', 'professional'],
  },
} satisfies ModuleRegisterPayload;
