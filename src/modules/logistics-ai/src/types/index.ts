export type PredictedDelay = 'none' | 'low' | 'medium' | 'high';

export interface DelayPrediction {
  id: string;
  tenantId: string;
  orderId: string;
  driverId: string;
  predictedDelay: PredictedDelay;
  delayMinutesEstimate: number;
  confidenceScore: number;
  etaOriginal: Date;
  etaPredicted: Date;
  factors: DelayFactor[];
  fallbackUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DelayFactor {
  type: 'traffic' | 'weather' | 'historical' | 'driver_performance' | 'time_of_day' | 'region';
  weight: number;
  description: string;
}

export interface RouteSuggestion {
  id: string;
  tenantId: string;
  type: 'reorder_stops' | 'change_driver' | 'alternative_route';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedImprovement: {
    timeReductionMinutes: number;
    distanceReductionKm: number;
    delayRiskReduction: number;
  };
  confidence: number;
  requiresConfirmation: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface RouteOptimizationRequest {
  tenantId: string;
  driverId?: string;
  orderIds: string[];
  currentRoute?: RoutePoint[];
  constraints: RouteConstraints;
}

export interface RoutePoint {
  orderId: string;
  latitude: number;
  longitude: number;
  address: string;
  estimatedServiceTime: number;
  priority: 'low' | 'medium' | 'high';
}

export interface RouteConstraints {
  maxStopsPerRoute: number;
  maxRouteDurationMinutes: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  vehicleCapacity?: number;
}

export interface OptimizedRoute {
  id: string;
  tenantId: string;
  driverId: string;
  points: RoutePoint[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  estimatedDelayRisk: PredictedDelay;
  fallbackUsed: boolean;
  createdAt: Date;
}

export interface AiAlert {
  id: string;
  tenantId: string;
  type: 'delay_prediction' | 'route_suggestion' | 'eta_update' | 'driver_performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityId?: string;
  entityType?: 'order' | 'driver' | 'route';
  actionRequired: boolean;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface LogisticsAiSettings {
  id: string;
  tenantId: string;
  delayPredictionEnabled: boolean;
  routeOptimizationEnabled: boolean;
  autoAlertsEnabled: boolean;
  confidenceThreshold: number;
  predictionHorizonMinutes: number;
  maxSuggestionsPerDriver: number;
  workingHoursEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryHistoryData {
  orderId: string;
  driverId: string;
  distanceKm: number;
  etaOriginal: Date;
  etaReal: Date;
  status: 'completed' | 'cancelled' | 'delayed';
  delayMinutes: number;
  hourOfDay: number;
  dayOfWeek: number;
  region: string;
  weatherCondition?: string;
  trafficLevel?: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface AiDecisionLog {
  id: string;
  tenantId: string;
  decisionType: 'delay_prediction' | 'route_suggestion' | 'alert_generation';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  modelVersion: string;
  processingTimeMs: number;
  userId?: string;
  createdAt: Date;
}

export interface LogisticsAiServiceContract {
  predictDelay(tenantId: string, orderId: string): Promise<DelayPrediction | null>;
  generateRouteSuggestions(tenantId: string, driverId: string): Promise<RouteSuggestion[]>;
  optimizeRoute(tenantId: string, request: RouteOptimizationRequest): Promise<OptimizedRoute>;
  createAlert(tenantId: string, alert: Omit<AiAlert, 'id' | 'tenantId' | 'createdAt'>): Promise<AiAlert>;
  getSettings(tenantId: string): Promise<LogisticsAiSettings | null>;
  updateSettings(tenantId: string, settings: Partial<LogisticsAiSettings>): Promise<LogisticsAiSettings>;
  logDecision(tenantId: string, log: Omit<AiDecisionLog, 'id' | 'tenantId' | 'createdAt'>): Promise<AiDecisionLog>;
}

export interface LogisticsPerformanceData {
  date: Date;
  deliveries: number;
  averageDelay: number;
  onTimeRate: number;
  totalDistance: number;
  region: string;
}

export interface OperationalEfficiencyData {
  date: Date;
  totalDeliveries: number;
  totalDrivers: number;
  averageDeliveryTime: number;
  fuelConsumption: number;
  customerSatisfaction: number;
  operationalCost: number;
}

export interface LogisticsPerformanceMetrics {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  regionalPerformance: Record<string, {
    score: number;
    deliveries: number;
    averageDelay: number;
  }>;
  comparison: {
    percentile: number;
    rank: number;
    totalDrivers: number;
  };
}
