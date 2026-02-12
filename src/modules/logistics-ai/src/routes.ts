import type { ComponentType } from 'react';
import type { TenantModuleRoute } from '@/src/modules/registry';
import { asModuleId } from '@/src/core/types';
import { LogisticsAiDashboard } from './ui/logistics-ai-dashboard';

export const logisticsAiRoutes: TenantModuleRoute[] = [
  {
    path: '/logistics-ai',
    moduleId: asModuleId('logistics-ai'),
    Component: LogisticsAiDashboard,
  },
];
