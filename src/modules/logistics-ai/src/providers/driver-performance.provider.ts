export class DriverPerformanceProvider {
  async getDriverPerformanceMetrics(tenantId: string, driverId: string, days: number = 30): Promise<{
    driverId: string;
    totalDeliveries: number;
    averageDelayMinutes: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
    performanceScore: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    regionalPerformance: Record<string, {
      deliveries: number;
      averageDelay: number;
      onTimeRate: number;
    }>;
  }> {
    const mockData = this.generateMockPerformanceData(driverId, days);
    
    return {
      driverId,
      totalDeliveries: mockData.totalDeliveries,
      averageDelayMinutes: mockData.averageDelayMinutes,
      onTimeDeliveryRate: mockData.onTimeDeliveryRate,
      averageDeliveryTime: mockData.averageDeliveryTime,
      performanceScore: mockData.performanceScore,
      performanceTrend: mockData.performanceTrend,
      strengths: mockData.strengths,
      weaknesses: mockData.weaknesses,
      recommendations: mockData.recommendations,
      regionalPerformance: mockData.regionalPerformance,
    };
  }

  async getTopPerformers(tenantId: string, limit: number = 10): Promise<Array<{
    driverId: string;
    driverName: string;
    performanceScore: number;
    totalDeliveries: number;
    onTimeRate: number;
    averageDelay: number;
  }>> {
    const mockDrivers = [
      { driverId: 'driver_001', driverName: 'João Silva', performanceScore: 92, totalDeliveries: 145, onTimeRate: 94, averageDelay: 3.2 },
      { driverId: 'driver_002', driverName: 'Maria Santos', performanceScore: 88, totalDeliveries: 132, onTimeRate: 91, averageDelay: 4.5 },
      { driverId: 'driver_003', driverName: 'Carlos Oliveira', performanceScore: 85, totalDeliveries: 128, onTimeRate: 89, averageDelay: 5.1 },
      { driverId: 'driver_004', driverName: 'Ana Costa', performanceScore: 90, totalDeliveries: 139, onTimeRate: 92, averageDelay: 3.8 },
      { driverId: 'driver_005', driverName: 'Pedro Lima', performanceScore: 83, totalDeliveries: 125, onTimeRate: 87, averageDelay: 6.2 },
    ];

    return mockDrivers
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit);
  }

  async getPerformanceComparison(tenantId: string, driverIds: string[]): Promise<{
    drivers: Array<{
      driverId: string;
      performanceScore: number;
      rank: number;
      percentile: number;
    }>;
    averagePerformance: number;
    performanceGap: {
      highest: number;
      lowest: number;
      gap: number;
    };
  }> {
    const drivers = await Promise.all(
      driverIds.map(async (driverId) => {
        const metrics = await this.getDriverPerformanceMetrics(tenantId, driverId);
        return {
          driverId,
          performanceScore: metrics.performanceScore,
        };
      })
    );

    const sortedDrivers = drivers.sort((a, b) => b.performanceScore - a.performanceScore);
    const averagePerformance = drivers.reduce((sum, d) => sum + d.performanceScore, 0) / drivers.length;

    const rankedDrivers = sortedDrivers.map((driver, index) => ({
      ...driver,
      rank: index + 1,
      percentile: ((sortedDrivers.length - index) / sortedDrivers.length) * 100,
    }));

    return {
      drivers: rankedDrivers,
      averagePerformance,
      performanceGap: {
        highest: sortedDrivers[0]?.performanceScore || 0,
        lowest: sortedDrivers[sortedDrivers.length - 1]?.performanceScore || 0,
        gap: (sortedDrivers[0]?.performanceScore || 0) - (sortedDrivers[sortedDrivers.length - 1]?.performanceScore || 0),
      },
    };
  }

  async getPerformanceInsights(tenantId: string, driverId: string): Promise<{
    keyInsights: string[];
    actionableRecommendations: string[];
    riskFactors: string[];
    improvementOpportunities: string[];
  }> {
    const metrics = await this.getDriverPerformanceMetrics(tenantId, driverId);
    
    const insights = [];
    const recommendations = [];
    const risks = [];
    const opportunities = [];

    if (metrics.performanceScore >= 90) {
      insights.push('Desempenho excelente - motorista está no top 10%');
      recommendations.push('Considerar para programa de mentoria de novos motoristas');
    } else if (metrics.performanceScore >= 80) {
      insights.push('Desempenho bom com potencial de melhoria');
      recommendations.push('Focar em otimização de rotas para reduzir atrasos');
    } else if (metrics.performanceScore >= 70) {
      insights.push('Desempenho médio - atenção necessária');
      recommendations.push('Programa de treinamento recomendado');
      risks.push('Risco de baixo desempenho se não houver intervenção');
    } else {
      insights.push('Desempenho abaixo do esperado');
      recommendations.push('Avaliação de desempenho urgente necessária');
      risks.push('Alto risco de problemas operacionais');
    }

    if (metrics.averageDelayMinutes > 10) {
      insights.push('Tempo médio de atraso acima da meta');
      recommendations.push('Revisar planejamento de rotas e horários');
      risks.push('Impacto negativo na satisfação do cliente');
    }

    if (metrics.onTimeDeliveryRate < 85) {
      insights.push('Taxa de entrega no prazo abaixo da meta');
      recommendations.push('Implementar sistema de alertas de tempo');
    }

    const regionalData = Object.entries(metrics.regionalPerformance);
    const worstRegion = regionalData.sort(([, a], [, b]) => a.averageDelay - b.averageDelay)[0];
    if (worstRegion && worstRegion[1].averageDelay > 10) {
      opportunities.push(`Oportunidade de melhoria na região ${worstRegion[0]}`);
      recommendations.push(`Treinamento específico para região ${worstRegion[0]}`);
    }

    return {
      keyInsights: insights,
      actionableRecommendations: recommendations,
      riskFactors: risks,
      improvementOpportunities: opportunities,
    };
  }

  private generateMockPerformanceData(driverId: string, days: number): {
    totalDeliveries: number;
    averageDelayMinutes: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
    performanceScore: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    regionalPerformance: Record<string, { deliveries: number; averageDelay: number; onTimeRate: number }>;
  } {
    void driverId;
    void days;
    const baseScore = 70 + Math.random() * 25;
    const totalDeliveries = Math.floor(100 + Math.random() * 50);
    const averageDelay = Math.random() * 10;
    const onTimeRate = 85 + Math.random() * 12;

    const performanceScore = Math.round(
      (onTimeRate * 0.4) + ((10 - Math.min(averageDelay, 10)) * 4) + (baseScore * 0.2)
    );

    const trends: ('improving' | 'stable' | 'declining')[] = ['improving', 'stable', 'declining'];
    const performanceTrend = trends[Math.floor(Math.random() * trends.length)] ?? 'stable';

    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (onTimeRate > 90) strengths.push('Alta taxa de pontualidade');
    if (averageDelay < 5) strengths.push('Baixo tempo médio de atraso');
    if (totalDeliveries > 120) strengths.push('Alta produtividade');

    if (onTimeRate < 85) weaknesses.push('Taxa de pontualidade abaixo da meta');
    if (averageDelay > 7) weaknesses.push('Tempo médio de atraso elevado');
    if (performanceScore < 80) weaknesses.push('Desempenho geral abaixo do esperado');

    if (averageDelay > 5) recommendations.push('Focar em otimização de rotas');
    if (onTimeRate < 90) recommendations.push('Melhorar gerenciamento de tempo');
    if (performanceScore < 85) recommendations.push('Participar de treinamento de desempenho');

    return {
      totalDeliveries,
      averageDelayMinutes: Math.round(averageDelay * 10) / 10,
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
      averageDeliveryTime: Math.round((25 + Math.random() * 15) * 10) / 10,
      performanceScore: Math.round(performanceScore),
      performanceTrend,
      strengths,
      weaknesses,
      recommendations,
      regionalPerformance: {
        centro: { deliveries: 45, averageDelay: 4.2, onTimeRate: 92 },
        norte: { deliveries: 32, averageDelay: 6.8, onTimeRate: 87 },
        sul: { deliveries: 28, averageDelay: 5.1, onTimeRate: 89 },
      },
    };
  }
}
