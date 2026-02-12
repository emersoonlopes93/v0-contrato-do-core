export const LOGISTICS_AI_EVENTS = {
  DELAY_PREDICTION_CREATED: 'logistics-ai:delay-prediction-created',
  ROUTE_SUGGESTION_GENERATED: 'logistics-ai:route-suggestion-generated',
  AI_ALERT_TRIGGERED: 'logistics-ai:alert-triggered',
  ETA_UPDATED: 'logistics-ai:eta-updated',
  ROUTE_OPTIMIZATION_COMPLETED: 'logistics-ai:route-optimization-completed',
  PREDICTION_ACCURACY_UPDATED: 'logistics-ai:prediction-accuracy-updated',
  AI_DECISION_LOGGED: 'logistics-ai:decision-logged',
  MODULE_STATUS_CHANGED: 'logistics-ai:module-status-changed',
} as const;

export type LogisticsAiEvent = typeof LOGISTICS_AI_EVENTS[keyof typeof LOGISTICS_AI_EVENTS];
