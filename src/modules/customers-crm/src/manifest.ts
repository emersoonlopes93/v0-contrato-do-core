import type {
  ModuleEventType,
  ModulePermission,
  ModuleRegisterPayload,
} from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';

export const CUSTOMERS_CRM_PERMISSIONS = {
  VIEW: 'customers-crm.view',
  MANAGE: 'customers-crm.manage',
} as const;

export type CustomersCrmPermission =
  (typeof CUSTOMERS_CRM_PERMISSIONS)[keyof typeof CUSTOMERS_CRM_PERMISSIONS];

const permissions: ModulePermission[] = Object.values(CUSTOMERS_CRM_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: id,
}));

const eventTypes: ModuleEventType[] = [];

export const manifest: ModuleRegisterPayload = {
  id: asModuleId('customers-crm'),
  name: 'CRM de Clientes',
  description: 'Gestão inteligente de clientes e métricas de compras do tenant.',
  version: '1.0.0',
  permissions,
  eventTypes,
  uiEntry: {
    tenantBasePath: '/crm',
    homeLabel: 'CRM Clientes',
    icon: 'users',
    category: 'Operação',
  },
  navigation: {
    category: 'clientes',
    priority: 25,
    modes: ['professional'],
    isAdvanced: true,
  },
  type: 'operational',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
};
