import { describe, it, expect } from 'vitest';
import { generateStrategicInsights } from '@/src/modules/dashboard-executivo/src/application/services/strategic-insights.service';

describe('Strategic Insights Service', () => {
  it('should generate 3-7 prioritized insights with required fields', () => {
    const insights = generateStrategicInsights({
      revenue: 500000,
      orders: 8000,
      ticketAverage: 55,
      churnRate: 0.12,
      customerRFM: {
        recencyAvg: 20,
        frequencyAvg: 2.1,
        monetaryAvg: 120,
        segments: { vip: 120, recorrentes: 950, novos: 2100 },
      },
      peakHours: [
        { hour: 12, orderShare: 24, revenueShare: 26 },
        { hour: 13, orderShare: 22, revenueShare: 23 },
        { hour: 20, orderShare: 14, revenueShare: 13 },
      ],
      cancellationRate: 0.06,
      deliveryDelay: { avg: 48, p95: 72 },
      repeatCustomerRate: 0.22,
      marketingPerformance: { roas: 1.6, cac: 18, conversionRate: 0.02 },
      operationalCost: { total: 360000, variable: 240000, fixed: 120000 },
      profitMargin: 18,
      alerts: [{ type: 'churn', severity: 'high', message: 'Churn em alta' }],
      historicalComparison: {
        revenueGrowth: -0.08,
        ticketAverageChange: -0.03,
        profitMarginChange: -2.5,
        churnRateChange: 0.03,
        repeatCustomerRateChange: -0.02,
        deliveryDelayChange: 0.12,
      },
      benchmarkComparison: {
        ticketAverage: 62,
        churnRate: 0.08,
        repeatCustomerRate: 0.32,
        deliveryDelayAvg: 38,
        profitMargin: 22,
        cancellationRate: 0.04,
      },
    });

    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThanOrEqual(3);
    expect(insights.length).toBeLessThanOrEqual(7);
    for (const i of insights) {
      expect(i.type).toBeTypeOf('string');
      expect(i.title).toBeTypeOf('string');
      expect(i.diagnosis).toBeTypeOf('string');
      expect(['low', 'medium', 'high', 'critical']).toContain(i.impactLevel);
      expect(i.estimatedImpact).toBeTypeOf('string');
      expect(i.recommendedAction).toBeTypeOf('string');
      expect(i.priority).toBeGreaterThanOrEqual(1);
      expect(i.priority).toBeLessThanOrEqual(5);
      expect(['Revenue', 'Retention', 'Efficiency', 'Marketing', 'Operations', 'Expansion']).toContain(i.strategicCategory);
    }
    const priorities = insights.map(i => i.priority);
    const sorted = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sorted);
  });
});
