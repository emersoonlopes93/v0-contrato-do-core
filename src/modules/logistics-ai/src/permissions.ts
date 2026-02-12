export const LOGISTICS_AI_PERMISSIONS = {
  VIEW_AI_PREDICTIONS: 'logistics-ai:view-predictions',
  MANAGE_AI_SETTINGS: 'logistics-ai:manage-settings',
  VIEW_ROUTE_SUGGESTIONS: 'logistics-ai:view-route-suggestions',
  APPROVE_ROUTE_CHANGES: 'logistics-ai:approve-route-changes',
  VIEW_DELAY_ALERTS: 'logistics-ai:view-delay-alerts',
  MANAGE_AI_ALERTS: 'logistics-ai:manage-alerts',
  ACCESS_AI_ANALYTICS: 'logistics-ai:access-analytics',
  AUDIT_AI_DECISIONS: 'logistics-ai:audit-decisions',
} as const;

export type LogisticsAiPermission = typeof LOGISTICS_AI_PERMISSIONS[keyof typeof LOGISTICS_AI_PERMISSIONS];
