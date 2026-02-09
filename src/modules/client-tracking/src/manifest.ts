import type { ModuleEventType, ModulePermission, ModuleRegisterPayload } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';

const permissions: ModulePermission[] = [];
const eventTypes: ModuleEventType[] = [];

export const manifest = {
  id: asModuleId('client-tracking'),
  name: 'Client Tracking',
  description: 'Acompanhamento público do pedido em tempo real',
  version: '1.0.0',
  requiredPlan: 'basic',
  permissions,
  eventTypes,
  type: 'visual',
  scope: 'public',
  mobileFirst: true,
  requiresAuth: false,
  canDisable: true,
} satisfies ModuleRegisterPayload;
