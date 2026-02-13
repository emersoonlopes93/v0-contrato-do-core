export type StrategicInsightType = 'opportunity' | 'risk' | 'growth' | 'retention' | 'operational' | 'financial';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type StrategicCategory = 'Revenue' | 'Retention' | 'Efficiency' | 'Marketing' | 'Operations' | 'Expansion';

export interface RfmSegments {
  vip: number;
  recorrentes: number;
  novos: number;
}

export interface StrategicInsightsInput {
  revenue: number;
  orders: number;
  ticketAverage: number;
  churnRate: number;
  customerRFM: {
    recencyAvg: number;
    frequencyAvg: number;
    monetaryAvg: number;
    segments: RfmSegments;
  };
  peakHours: Array<{
    hour: number;
    orderShare: number;
    revenueShare: number;
  }>;
  cancellationRate: number;
  deliveryDelay: {
    avg: number;
    p95: number;
  };
  repeatCustomerRate: number;
  marketingPerformance: {
    roas: number;
    cac: number;
    conversionRate: number;
    channelBreakdown?: Record<string, { roas: number; cac: number; conversionRate: number }>;
  };
  operationalCost: {
    total: number;
    variable: number;
    fixed: number;
  };
  profitMargin: number;
  alerts: Array<{
    type: string;
    severity: ImpactLevel;
    message: string;
  }>;
  historicalComparison: {
    revenueGrowth: number;
    ticketAverageChange: number;
    profitMarginChange: number;
    churnRateChange: number;
    repeatCustomerRateChange: number;
    deliveryDelayChange: number;
  };
  benchmarkComparison: {
    ticketAverage: number;
    churnRate: number;
    repeatCustomerRate: number;
    deliveryDelayAvg: number;
    profitMargin: number;
    cancellationRate: number;
  };
}

export interface StrategicInsight {
  type: StrategicInsightType;
  title: string;
  diagnosis: string;
  impactLevel: ImpactLevel;
  estimatedImpact: string;
  recommendedAction: string;
  priority: number;
  strategicCategory: StrategicCategory;
}
