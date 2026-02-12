import type { DelayPrediction, DelayFactor, PredictedDelay, DeliveryHistoryData } from '../types';

export class DelayPredictor {
  async predictDelay(
    historicalData: DeliveryHistoryData[],
    currentConditions: Record<string, unknown>
  ): Promise<{
    predictedDelay: PredictedDelay;
    delayMinutesEstimate: number;
    confidenceScore: number;
    factors: DelayFactor[];
  }> {
    const factors = this.analyzeFactors(historicalData, currentConditions);
    const delayRisk = this.calculateDelayRisk(factors);
    const confidenceScore = this.calculateConfidence(historicalData, factors);
    const delayMinutesEstimate = this.estimateDelayMinutes(delayRisk, factors);

    return {
      predictedDelay: delayRisk,
      delayMinutesEstimate,
      confidenceScore,
      factors,
    };
  }

  private analyzeFactors(
    historicalData: DeliveryHistoryData[],
    currentConditions: Record<string, unknown>
  ): DelayFactor[] {
    const factors: DelayFactor[] = [];

    const trafficFactor = this.analyzeTrafficFactor(currentConditions);
    if (trafficFactor) factors.push(trafficFactor);

    const weatherFactor = this.analyzeWeatherFactor(currentConditions);
    if (weatherFactor) factors.push(weatherFactor);

    const timeFactor = this.analyzeTimeOfDayFactor(currentConditions);
    if (timeFactor) factors.push(timeFactor);

    const historicalFactor = this.analyzeHistoricalFactor(historicalData);
    if (historicalFactor) factors.push(historicalFactor);

    const regionFactor = this.analyzeRegionFactor(historicalData, currentConditions);
    if (regionFactor) factors.push(regionFactor);

    const performanceFactor = this.analyzeDriverPerformanceFactor(historicalData);
    if (performanceFactor) factors.push(performanceFactor);

    return factors.sort((a, b) => b.weight - a.weight);
  }

  private analyzeTrafficFactor(currentConditions: Record<string, unknown>): DelayFactor | null {
    const trafficLevel = currentConditions.trafficLevel as string;
    
    if (trafficLevel === 'high') {
      return {
        type: 'traffic',
        weight: 0.4,
        description: 'Tráfego intenso na região',
      };
    } else if (trafficLevel === 'medium') {
      return {
        type: 'traffic',
        weight: 0.2,
        description: 'Tráfego moderado',
      };
    }

    return null;
  }

  private analyzeWeatherFactor(currentConditions: Record<string, unknown>): DelayFactor | null {
    const weatherCondition = currentConditions.weatherCondition as string;
    
    if (weatherCondition === 'storm') {
      return {
        type: 'weather',
        weight: 0.5,
        description: 'Tempestade severa',
      };
    } else if (weatherCondition === 'rain') {
      return {
        type: 'weather',
        weight: 0.3,
        description: 'Chuva forte',
      };
    } else if (weatherCondition === 'fog') {
      return {
        type: 'weather',
        weight: 0.25,
        description: 'Névoa densa',
      };
    }

    return null;
  }

  private analyzeTimeOfDayFactor(currentConditions: Record<string, unknown>): DelayFactor | null {
    const hourOfDay = currentConditions.hourOfDay as number;
    
    if ((hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 17 && hourOfDay <= 19)) {
      return {
        type: 'time_of_day',
        weight: 0.3,
        description: 'Horário de pico - rush hour',
      };
    } else if (hourOfDay >= 11 && hourOfDay <= 13) {
      return {
        type: 'time_of_day',
        weight: 0.15,
        description: 'Horário de almoço - tráfego elevado',
      };
    }

    return null;
  }

  private analyzeHistoricalFactor(historicalData: DeliveryHistoryData[]): DelayFactor | null {
    if (historicalData.length < 10) return null;

    const recentDeliveries = historicalData.slice(-30);
    const delayedDeliveries = recentDeliveries.filter(d => d.delayMinutes > 15);
    const delayRate = delayedDeliveries.length / recentDeliveries.length;

    if (delayRate > 0.4) {
      return {
        type: 'historical',
        weight: 0.35,
        description: 'Alta incidência de atrasos históricos nesta rota',
      };
    } else if (delayRate > 0.25) {
      return {
        type: 'historical',
        weight: 0.2,
        description: 'Taxa de atrasos históricos moderada',
      };
    }

    return null;
  }

  private analyzeRegionFactor(
    historicalData: DeliveryHistoryData[],
    currentConditions: Record<string, unknown>
  ): DelayFactor | null {
    const region = currentConditions.region as string;
    if (!region) return null;

    const regionData = historicalData.filter(d => d.region === region);
    if (regionData.length < 5) return null;

    const averageDelay = regionData.reduce((sum, d) => sum + d.delayMinutes, 0) / regionData.length;

    if (averageDelay > 20) {
      return {
        type: 'region',
        weight: 0.25,
        description: `Região ${region} com histórico de atrasos elevados`,
      };
    } else if (averageDelay > 10) {
      return {
        type: 'region',
        weight: 0.15,
        description: `Região ${region} com atrasos moderados`,
      };
    }

    return null;
  }

  private analyzeDriverPerformanceFactor(historicalData: DeliveryHistoryData[]): DelayFactor | null {
    if (historicalData.length < 5) return null;

    const averageDelay = historicalData.reduce((sum, d) => sum + d.delayMinutes, 0) / historicalData.length;
    const onTimeRate = historicalData.filter(d => d.delayMinutes <= 5).length / historicalData.length;

    if (averageDelay > 15 && onTimeRate < 0.8) {
      return {
        type: 'driver_performance',
        weight: 0.3,
        description: 'Desempenho do entregador abaixo da média',
      };
    } else if (averageDelay > 10) {
      return {
        type: 'driver_performance',
        weight: 0.15,
        description: 'Desempenho do entregador moderado',
      };
    }

    return null;
  }

  private calculateDelayRisk(factors: DelayFactor[]): PredictedDelay {
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    
    if (totalWeight >= 0.8) return 'high';
    if (totalWeight >= 0.5) return 'medium';
    if (totalWeight >= 0.2) return 'low';
    return 'none';
  }

  private calculateConfidence(historicalData: DeliveryHistoryData[], factors: DelayFactor[]): number {
    let confidence = 0.3;

    const dataPoints = historicalData.length;
    if (dataPoints > 100) confidence += 0.3;
    else if (dataPoints > 50) confidence += 0.2;
    else if (dataPoints > 20) confidence += 0.1;
    else if (dataPoints > 10) confidence += 0.05;

    if (factors.length >= 3) confidence += 0.2;
    else if (factors.length >= 2) confidence += 0.1;
    else if (factors.length >= 1) confidence += 0.05;

    const highWeightFactors = factors.filter(f => f.weight >= 0.3).length;
    if (highWeightFactors >= 2) confidence += 0.2;
    else if (highWeightFactors >= 1) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  private estimateDelayMinutes(delayRisk: PredictedDelay, factors: DelayFactor[]): number {
    const baseDelay = {
      none: 0,
      low: 8,
      medium: 20,
      high: 40,
    };

    let multiplier = 1;
    const trafficFactor = factors.find(f => f.type === 'traffic');
    const weatherFactor = factors.find(f => f.type === 'weather');

    if (trafficFactor && trafficFactor.weight >= 0.4) multiplier += 0.5;
    if (weatherFactor && weatherFactor.weight >= 0.4) multiplier += 0.3;

    return Math.round(baseDelay[delayRisk] * multiplier);
  }

  async validatePrediction(prediction: DelayPrediction, actualDelay: number): Promise<{
    accuracy: number;
    error: number;
    wasCorrect: boolean;
  }> {
    const error = Math.abs(prediction.delayMinutesEstimate - actualDelay);
    const maxPossibleError = 60;
    const accuracy = Math.max(0, 1 - (error / maxPossibleError));
    
    const predictedRisk = prediction.predictedDelay;
    let actualRisk: PredictedDelay;
    
    if (actualDelay <= 5) actualRisk = 'none';
    else if (actualDelay <= 15) actualRisk = 'low';
    else if (actualDelay <= 30) actualRisk = 'medium';
    else actualRisk = 'high';

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      error,
      wasCorrect: predictedRisk === actualRisk,
    };
  }
}
