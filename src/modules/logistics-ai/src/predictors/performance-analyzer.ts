import type { LogisticsPerformanceData, LogisticsPerformanceMetrics } from '../types';

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
    operationalData: Array<{
      date: Date;
      totalDeliveries: number;
      totalDrivers: number;
      averageDeliveryTime: number;
      fuelConsumption: number;
      customerSatisfaction: number;
      operationalCost: number;
    }>
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
    const strengths = [];
    const latest = data[data.length - 1];

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
    const weaknesses = [];
    const latest = data[data.length - 1];

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
      if (!regionalData[day.region]) {
        regionalData[day.region] = [];
      }
      regionalData[day.region].push(day);
    });

    const performance: Record<string, { score: number; deliveries: number; averageDelay: number; }> = {};

    Object.keys(regionalData).forEach(region => {
      const regionData = regionalData[region];
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

  private calculateEfficiencyScore(data: LogisticsPerformanceData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    // Usar apenas propriedades disponíveis na interface
    const efficiencyScore = (latest.deliveries * latest.onTimeRate) * 10;
    return Math.round(efficiencyScore);
  }

  private calculateUtilizationRate(data: LogisticsPerformanceData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    // Usar apenas propriedades disponíveis - simular utilização baseada em deliveries
    const utilizationRate = Math.min(100, (latest.deliveries / 20) * 100);
    return Math.round(utilizationRate);
  }

  private calculateCostEfficiency(data: LogisticsPerformanceData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    // Simular eficiência de custo baseada em distance e deliveries
    const costEfficiency = Math.max(0, Math.min(100, (latest.deliveries / (latest.totalDistance || 1)) * 50));
    return Math.round(costEfficiency);
  }

  private calculateQualityScore(data: LogisticsPerformanceData[]): number {
    if (data.length === 0) return 0;

    const latest = data[data.length - 1];
    if (!latest) return 0;
    
    // Simular qualidade baseada em onTimeRate
    const qualityScore = latest.onTimeRate * 100;
    return Math.round(qualityScore);
  }

  private calculateTrendDirection(recent: LogisticsPerformanceData[], older: LogisticsPerformanceData[], field: keyof LogisticsPerformanceData): 'up' | 'stable' | 'down' {
    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, d) => sum + d[field], 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d[field], 0) / older.length;

    const difference = (recentAvg - olderAvg) / olderAvg;
    
    if (difference > 0.05) return 'up';
    if (difference < -0.05) return 'down';
    return 'stable';
  }

  private generateOperationalInsights(data: LogisticsPerformanceData[], trends: Record<string, string>): string[] {
    const insights = [];
    const latest = data[data.length - 1];
    if (!latest) return insights;

    if (trends.deliveries === 'up') {
      insights.push('Crescimento positivo no volume de entregas');
    } else if (trends.deliveries === 'down') {
      insights.push('Redução no volume de entregas requer atenção');
    }

    if (latest.onTimeRate >= 0.9) {
      insights.push('Excelente pontualidade nas entregas');
    } else if (latest.onTimeRate < 0.7) {
      insights.push('Taxa de pontualidade abaixo da meta');
    }

    return insights;
  }

  private generateOperationalRecommendations(insights: string[], trends: Record<string, string>): string[] {
    const recommendations = [];

    if (trends.deliveries === 'down') {
      recommendations.push('Investigar causas da queda de entregas');
      recommendations.push('Desenvolver estratégias de recuperação');
    }

    if (insights.includes('Taxa de pontualidade abaixo da meta')) {
      recommendations.push('Coletar feedback dos clientes');
      recommendations.push('Revisar processos de entrega');
    }

    return recommendations;
  }
}
