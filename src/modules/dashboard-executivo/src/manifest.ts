import type { ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DASHBOARD_EXECUTIVO_PERMISSIONS } from './permissions';

const permissions: ModulePermission[] = Object.values(DASHBOARD_EXECUTIVO_PERMISSIONS).map((id) => ({
  id,
  name: id,
  description: 'Visualizar Dashboard Executivo',
}));

export const manifest = {
  id: asModuleId('dashboard-executivo'),
  name: 'Dashboard Executivo',
  version: '1.0.0',
  description: 'Métricas estratégicas para proprietários',
  permissions,
  eventTypes: [],
  uiEntry: {
    tenantBasePath: '/dashboard/executivo',
    homeLabel: 'Dashboard Executivo',
    icon: 'bar-chart-2', // Nome de ícone comum (Lucide)
    category: 'Gestão',
  },
  type: 'strategic',
  scope: 'tenant',
  mobileFirst: true,
  requiresAuth: true,
  canDisable: true,
} satisfies ModuleRegisterPayload;
