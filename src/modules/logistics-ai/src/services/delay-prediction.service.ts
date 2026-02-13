import type { DelayPrediction, DeliveryHistoryData } from '../types';
import type { CurrentConditions } from '../types/internal';
import { DelayPredictor } from '../predictors/delay-predictor';
import { LogisticsAiLogger } from '../utils/logistics-ai.logger';
import { LogisticsAiFeatureFlags } from '../utils/feature-flags';
import { withTimeout, TimeoutError } from '../utils/timeout';
import { LogisticsAiRepository } from '../repositories/logistics-ai.repository';

export class DelayPredictionService {
  private predictor: DelayPredictor;
  private repository: LogisticsAiRepository;

  constructor() {
    this.predictor = new DelayPredictor();
    this.repository = LogisticsAiRepository.getInstance();
  }

  async predictDelay(tenantId: string, orderId: string): Promise<DelayPrediction | null> {
    // Feature flag check
    const canUse = await LogisticsAiFeatureFlags.canUseDelayPrediction(tenantId);
    if (!canUse) {
      return null;
    }

    try {
      const historicalData = await this.getHistoricalData(tenantId, orderId);
      const currentConditions = await this.getCurrentConditions(orderId);
      
      // Apply timeout
      const predictionResult = await withTimeout(
        this.predictor.predictDelay(historicalData, currentConditions as unknown as Record<string, unknown>),
        1500,
        tenantId,
        'delay_prediction'
      );
      
      const prediction: DelayPrediction = {
        id: `delay_${Date.now()}`,
        tenantId,
        orderId,
        driverId: '',
        predictedDelay: predictionResult.predictedDelay,
        delayMinutesEstimate: predictionResult.delayMinutesEstimate,
        confidenceScore: predictionResult.confidenceScore,
        etaOriginal: new Date(),
        etaPredicted: new Date(Date.now() + predictionResult.delayMinutesEstimate * 60 * 1000),
        factors: predictionResult.factors,
        fallbackUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Async logging - don't wait for it
      this.logDecisionAsync(tenantId, {
        tenantId,
        orderId,
        type: 'delay',
        input: { orderId, historicalData: historicalData.length, currentConditions } as unknown as Record<string, unknown>,
        output: prediction as unknown as Record<string, unknown>,
        confidenceScore: prediction.confidenceScore,
        fallbackUsed: false
      }).catch((error: Error) => {
        LogisticsAiLogger.error(tenantId, 'Failed to log decision', error as Error, {
          decisionType: 'delay_prediction',
          orderId
        });
      });

      return prediction;
    } catch (error) {
      if (error instanceof TimeoutError) {
        // Return fallback prediction on timeout
        const fallbackPrediction = this.createFallbackPrediction(tenantId, orderId);
        
        // Log the fallback usage
        this.logDecisionAsync(tenantId, {
          tenantId,
          orderId,
          type: 'delay',
          input: { orderId, timeout: true } as unknown as Record<string, unknown>,
          output: fallbackPrediction as unknown as Record<string, unknown>,
          confidenceScore: fallbackPrediction.confidenceScore,
          fallbackUsed: true
        }).catch(() => {}); // Ignore logging errors
        
        return fallbackPrediction;
      }
      
      LogisticsAiLogger.error(tenantId, 'Error predicting delay', error as Error, {
        decisionType: 'delay_prediction',
        orderId
      });
      
      // Return fallback on error
      return this.createFallbackPrediction(tenantId, orderId);
    }
  }

  private async getHistoricalData(tenantId: string, orderId: string): Promise<DeliveryHistoryData[]> {
    void tenantId;
    void orderId;
    return [];
  }

  private async getCurrentConditions(orderId: string): Promise<CurrentConditions> {
    void orderId;
    return {
      trafficLevel: 'medium',
      weatherCondition: 'clear',
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    };
  }

  private createFallbackPrediction(tenantId: string, orderId: string): DelayPrediction {
    return {
      id: `delay_fallback_${Date.now()}`,
      tenantId,
      orderId,
      driverId: '',
      predictedDelay: 'none',
      delayMinutesEstimate: 0,
      confidenceScore: 0.1,
      etaOriginal: new Date(),
      etaPredicted: new Date(),
      factors: [],
      fallbackUsed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async logDecisionAsync(tenantId: string, logData: {
    tenantId: string;
    orderId?: string;
    type: 'delay' | 'route' | 'alert';
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    confidenceScore: number;
    fallbackUsed: boolean;
  }): Promise<void> {
    await this.repository.saveDecisionLog(logData);
  }
}
