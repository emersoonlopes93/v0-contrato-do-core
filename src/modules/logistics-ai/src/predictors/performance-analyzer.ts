import type { LogisticsPerformanceData, LogisticsPerformanceMetrics, OperationalEfficiencyData } from '../types';

type NumericField<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T];

export class PerformanceAnalyzer {
  async analyzeDriverPerformance(
    driverId: string,
    historicalData: LogisticsPerformanceData[]
  ): Promise<LogisticsPerformanceMetrics> {
    const recentData = historicalData.slice(-30);
    const olderData = historicalData.slice(-60, -30);

    const overallScore = this.calculateOverallScore(recentData);
    const trend = this.calculateTrend(recentData, olderData);
    const strengths = this.identifyStrengths(recentData);
    const weaknesses = this.identifyWeaknesses(recentData);
    const recommendations = this.generateRecommendations(strengths, weaknesses, trend);
    const regionalPerformance = this.analyzeRegionalPerformance(recentData);
    const comparison = await this.generateComparison(driverId, overallScore);

    return {
      overallScore,
      trend,
      strengths,
      weaknesses,
      recommendations,
      regionalPerformance,
      comparison,
    };
  }

  async analyzeOperationalEfficiency(
    operationalData: OperationalEfficiencyData[]
  ): Promise<{
    efficiencyScore: number;
    utilizationRate: number;
    costEfficiency: number;
    qualityScore: number;
    trends: {
      deliveries: 'up' | 'stable' | 'down';
      costs: 'up' | 'stable' | 'down';
      satisfaction: 'up' | 'stable' | 'down';
    };
    insights: string[];
    recommendations: string[];
  }> {
    const recentData = operationalData.slice(-30);
    const olderData = operationalData.slice(-60, -30);

    const efficiencyScore = this.calculateEfficiencyScore(recentData);
    const utilizationRate = this.calculateUtilizationRate(recentData);
    const costEfficiency = this.calculateCostEfficiency(recentData);
    const qualityScore = this.calculateQualityScore(recentData);

    const trends = {
      deliveries: this.calculateTrendDirection(recentData, olderData, 'totalDeliveries'),
      costs: this.calculateTrendDirection(recentData, olderData, 'operationalCost'),
      satisfaction: this.calculateTrendDirection(recentData, olderData, 'customerSatisfaction'),
    };

    const insights = this.generateOperationalInsights(recentData, trends);
    const recommendations = this.generateOperationalRecommendations(insights, trends);

    return {
      efficiencyScore,
      utilizationRate,
      costEfficiency,
      qualityScore,
      trends,
      insights,
      recommendations,
    };
  }

  private calculateOverallScore(data: LogisticsPerformanceData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    const weights = {
      onTimeRate: 0.4,
      averageDelay: 0.3,
      deliveries: 0.2,
      consistency: 0.1,
    };

    const onTimeScore = Math.min(100, latest.onTimeRate * 100);
    const delayScore = Math.max(0, 100 - (latest.averageDelay * 5));
    const deliveryScore = Math.min(100, (latest.deliveries / 20) * 100);
    
    const delays = data.map(d => d.averageDelay);
    const avgDelay = delays.reduce((sum, d) => sum + d, 0) / delays.length;
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - avgDelay, 2), 0) / delays.length;
    const consistencyScore = Math.max(0, 100 - (variance * 10));

    return Math.round(
      onTimeScore * weights.onTimeRate +
      delayScore * weights.averageDelay +
      deliveryScore * weights.deliveries +
      consistencyScore * weights.consistency
    );
  }

  private calculateTrend(recent: LogisticsPerformanceData[], older: LogisticsPerformanceData[]): 'improving' | 'stable' | 'declining' {
    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, d) => sum + d.onTimeRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.onTimeRate, 0) / older.length;

    const difference = recentAvg - olderAvg;
    
    if (difference > 0.05) return 'improving';
    if (difference < -0.05) return 'declining';
    return 'stable';
  }

  private identifyStrengths(data: LogisticsPerformanceData[]): string[] {
    const strengths: string[] = [];
    const latest = data[data.length - 1];
    if (!latest) return strengths;

    if (latest.onTimeRate >= 0.9) {
      strengths.push('Excelente pontualidade nas entregas');
    }
    if (latest.averageDelay <= 5) {
      strengths.push('Baixo tempo médio de atraso');
    }
    if (latest.deliveries >= 15) {
      strengths.push('Alta produtividade');
    }

    const consistency = this.calculateConsistency(data);
    if (consistency >= 0.8) {
      strengths.push('Desempenho consistente');
    }

    return strengths;
  }

  private identifyWeaknesses(data: LogisticsPerformanceData[]): string[] {
    const weaknesses: string[] = [];
    const latest = data[data.length - 1];
    if (!latest) return weaknesses;

    if (latest.onTimeRate < 0.8) {
      weaknesses.push('Taxa de pontualidade abaixo da meta');
    }
    if (latest.averageDelay > 15) {
      weaknesses.push('Tempo médio de atraso elevado');
    }
    if (latest.deliveries < 10) {
      weaknesses.push('Baixa produtividade');
    }

    const consistency = this.calculateConsistency(data);
    if (consistency < 0.6) {
      weaknesses.push('Desempenho inconsistente');
    }

    return weaknesses;
  }

  private calculateConsistency(data: LogisticsPerformanceData[]): number {
    if (data.length < 2) return 1;

    const onTimeRates = data.map(d => d.onTimeRate);
    const avg = onTimeRates.reduce((sum, rate) => sum + rate, 0) / onTimeRates.length;
    const variance = onTimeRates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / onTimeRates.length;
    
    return Math.max(0, 1 - variance);
  }

  private generateRecommendations(strengths: string[], weaknesses: string[], trend: string): string[] {
    const recommendations = [];

    if (weaknesses.includes('Taxa de pontualidade abaixo da meta')) {
      recommendations.push('Implementar sistema de alertas de tempo');
      recommendations.push('Treinamento em gerenciamento de tempo');
    }

    if (weaknesses.includes('Tempo médio de atraso elevado')) {
      recommendations.push('Otimizar planejamento de rotas');
      recommendations.push('Analisar padrões de trânsito');
    }

    if (weaknesses.includes('Baixa produtividade')) {
      recommendations.push('Revisar método de organização de entregas');
      recommendations.push('Considerar uso de ferramentas de otimização');
    }

    if (trend === 'declining') {
      recommendations.push('Avaliação de desempenho urgente necessária');
      recommendations.push('Identificar causas da queda de performance');
    }

    if (strengths.includes('Excelente pontualidade nas entregas')) {
      recommendations.push('Compartilhar melhores práticas com equipe');
      recommendations.push('Considerar programa de mentoria');
    }

    return recommendations;
  }

  private analyzeRegionalPerformance(data: LogisticsPerformanceData[]): Record<string, { score: number; deliveries: number; averageDelay: number; }> {
    const regionalData: Record<string, LogisticsPerformanceData[]> = {};

    data.forEach(day => {
      const regionKey = day.region;
      const bucket = regionalData[regionKey] ?? [];
      bucket.push(day);
      regionalData[regionKey] = bucket;
    });

    const performance: Record<string, { score: number; deliveries: number; averageDelay: number; }> = {};

    Object.keys(regionalData).forEach(region => {
      const regionData = regionalData[region];
      if (!regionData || regionData.length === 0) return;
      const avgDelay = regionData.reduce((sum, d) => sum + d.averageDelay, 0) / regionData.length;
      const avgOnTime = regionData.reduce((sum, d) => sum + d.onTimeRate, 0) / regionData.length;
      const totalDeliveries = regionData.reduce((sum, d) => sum + d.deliveries, 0);

      performance[region] = {
        score: Math.round((avgOnTime * 100) - (avgDelay * 5)),
        deliveries: totalDeliveries,
        averageDelay: avgDelay,
      };
    });

    return performance;
  }

  private async generateComparison(driverId: string, score: number): Promise<{ percentile: number; rank: number; totalDrivers: number; }> {
    const mockDrivers = Array.from({ length: 50 }, (_, i) => ({
      id: `driver_${i}`,
      score: 60 + Math.random() * 35,
    }));

    const betterDrivers = mockDrivers.filter(d => d.score > score).length;
    const percentile = ((mockDrivers.length - betterDrivers) / mockDrivers.length) * 100;
    const rank = mockDrivers.length - betterDrivers;

    return {
      percentile: Math.round(percentile),
      rank,
      totalDrivers: mockDrivers.length,
    };
  }

  private calculateEfficiencyScore(data: OperationalEfficiencyData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    const deliveriesPerDriver = latest.totalDrivers > 0
      ? latest.totalDeliveries / latest.totalDrivers
      : latest.totalDeliveries;
    const efficiencyScore = Math.min(
      100,
      (deliveriesPerDriver * 10) + Math.min(100, latest.customerSatisfaction)
    );
    return Math.round(Math.max(0, efficiencyScore));
  }

  private calculateUtilizationRate(data: OperationalEfficiencyData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    const deliveriesPerDriver = latest.totalDrivers > 0
      ? latest.totalDeliveries / latest.totalDrivers
      : latest.totalDeliveries;
    const utilizationRate = Math.min(100, (deliveriesPerDriver / 15) * 100);
    return Math.round(utilizationRate);
  }

  private calculateCostEfficiency(data: OperationalEfficiencyData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    const costPerDelivery = latest.totalDeliveries > 0
      ? latest.operationalCost / latest.totalDeliveries
      : latest.operationalCost;
    const costEfficiency = Math.max(0, Math.min(100, 100 - (costPerDelivery * 2)));
    return Math.round(costEfficiency);
  }

  private calculateQualityScore(data: OperationalEfficiencyData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    const qualityScore = Math.min(100, Math.max(0, latest.customerSatisfaction));
    return Math.round(qualityScore);
  }

  private calculateTrendDirection<T, K extends NumericField<T>>(
    recent: T[],
    older: T[],
    field: K
  ): 'up' | 'stable' | 'down' {
    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, d) => {
      const value = d[field];
      return typeof value === 'number' ? sum + value : sum;
    }, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => {
      const value = d[field];
      return typeof value === 'number' ? sum + value : sum;
    }, 0) / older.length;

    const difference = (recentAvg - olderAvg) / olderAvg;
    
    if (difference > 0.05) return 'up';
    if (difference < -0.05) return 'down';
    return 'stable';
  }

  private generateOperationalInsights(
    data: OperationalEfficiencyData[],
    trends: { deliveries: 'up' | 'stable' | 'down'; costs: 'up' | 'stable' | 'down'; satisfaction: 'up' | 'stable' | 'down' }
  ): string[] {
    const insights: string[] = [];
    const latest = data[data.length - 1];
    if (!latest) return insights;

    if (trends.deliveries === 'up') {
      insights.push('Crescimento positivo no volume de entregas');
    } else if (trends.deliveries === 'down') {
      insights.push('Redução no volume de entregas requer atenção');
    }

    if (trends.costs === 'up') {
      insights.push('Custos operacionais em alta');
    }

    if (latest.customerSatisfaction >= 85) {
      insights.push('Satisfação do cliente acima do esperado');
    } else if (latest.customerSatisfaction < 70) {
      insights.push('Satisfação do cliente abaixo da meta');
    }

    return insights;
  }

  private generateOperationalRecommendations(
    insights: string[],
    trends: { deliveries: 'up' | 'stable' | 'down'; costs: 'up' | 'stable' | 'down'; satisfaction: 'up' | 'stable' | 'down' }
  ): string[] {
    const recommendations = [];

    if (trends.deliveries === 'down') {
      recommendations.push('Investigar causas da queda de entregas');
      recommendations.push('Desenvolver estratégias de recuperação');
    }

    if (insights.includes('Satisfação do cliente abaixo da meta')) {
      recommendations.push('Coletar feedback dos clientes');
      recommendations.push('Revisar processos de entrega');
    }

    if (trends.costs === 'up') {
      recommendations.push('Revisar custos operacionais e otimizar recursos');
    }

    return recommendations;
  }
}
