import type {
  ModuleEventType,
  ModulePermission,
  ModuleRegisterPayload,
} from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { MENU_ONLINE_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(MENU_ONLINE_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('menu-online'),
  name: 'Cardápio Online',
  description: 'Gestão completa de cardápio digital para restaurantes',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/menu-online',
    homeLabel: 'Cardápio Online',
    icon: 'menu',
    category: 'Core de Operação do Restaurante',
  },
  navigation: {
    category: 'cardapio',
    priority: 5,
    modes: ['essential', 'professional'],
  },
} satisfies ModuleRegisterPayload;
