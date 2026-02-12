export interface CurrentConditions {
  trafficLevel: 'low' | 'medium' | 'high';
  weatherCondition?: string;
  hourOfDay: number;
  dayOfWeek: number;
  region?: string;
}

export interface DelayPredictionInput {
  orderId: string;
  historicalData: number;
  currentConditions: CurrentConditions;
}

export interface DelayPredictionOutput {
  id: string;
  tenantId: string;
  orderId: string;
  driverId: string;
  predictedDelay: 'none' | 'low' | 'medium' | 'high';
  delayMinutesEstimate: number;
  confidenceScore: number;
  etaOriginal: Date;
  etaPredicted: Date;
  factors: Array<{
    type: 'traffic' | 'weather' | 'historical' | 'driver_performance' | 'time_of_day' | 'region';
    weight: number;
    description: string;
  }>;
  fallbackUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteOptimizationInput {
  request: {
    tenantId: string;
    driverId?: string;
    orderIds: string[];
    currentRoute?: Array<{
      orderId: string;
      latitude: number;
      longitude: number;
      address: string;
      estimatedServiceTime: number;
      priority: 'low' | 'medium' | 'high';
    }>;
    constraints: {
      maxStopsPerRoute: number;
      maxRouteDurationMinutes: number;
      workingHoursStart: string;
      workingHoursEnd: string;
      vehicleCapacity?: number;
    };
  };
  timeout?: boolean;
}

export interface RouteOptimizationOutput {
  id: string;
  tenantId: string;
  driverId: string;
  points: Array<{
    orderId: string;
    latitude: number;
    longitude: number;
    address: string;
    estimatedServiceTime: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  estimatedDelayRisk: 'none' | 'low' | 'medium' | 'high';
  fallbackUsed: boolean;
  createdAt: Date;
}
