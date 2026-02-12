import type { 
  DelayPrediction, 
  RouteSuggestion, 
  RouteOptimizationRequest, 
  OptimizedRoute, 
  AiAlert, 
  LogisticsAiSettings, 
  AiDecisionLog,
  LogisticsAiServiceContract 
} from '../types';
import { DelayPredictionService } from './delay-prediction.service';
import { RouteOptimizationService } from './route-optimization.service';
import { AlertService } from './alert.service';
import { SettingsService } from './settings.service';

export class LogisticsAiService implements LogisticsAiServiceContract {
  private delayPredictionService: DelayPredictionService;
  private routeOptimizationService: RouteOptimizationService;
  private alertService: AlertService;
  private settingsService: SettingsService;

  constructor() {
    this.delayPredictionService = new DelayPredictionService();
    this.routeOptimizationService = new RouteOptimizationService();
    this.alertService = new AlertService();
    this.settingsService = new SettingsService();
  }

  async predictDelay(tenantId: string, orderId: string): Promise<DelayPrediction | null> {
    const settings = await this.getSettings(tenantId);
    if (!settings?.delayPredictionEnabled) {
      return null;
    }

    const prediction = await this.delayPredictionService.predictDelay(tenantId, orderId);
    
    if (prediction && settings.autoAlertsEnabled && prediction.predictedDelay !== 'none') {
      await this.createDelayAlert(tenantId, prediction);
    }

    return prediction;
  }

  async generateRouteSuggestions(tenantId: string, driverId: string): Promise<RouteSuggestion[]> {
    const settings = await this.getSettings(tenantId);
    if (!settings?.routeOptimizationEnabled) {
      return [];
    }

    const suggestions = await this.routeOptimizationService.generateRouteSuggestions(tenantId, driverId);
    
    const filteredSuggestions = suggestions.slice(0, settings.maxSuggestionsPerDriver);

    if (settings.autoAlertsEnabled && filteredSuggestions.length > 0) {
      await this.createRouteSuggestionAlert(tenantId, filteredSuggestions);
    }

    return filteredSuggestions;
  }

  async optimizeRoute(tenantId: string, request: RouteOptimizationRequest): Promise<OptimizedRoute> {
    const settings = await this.getSettings(tenantId);
    if (!settings?.routeOptimizationEnabled) {
      throw new Error('Route optimization is disabled for this tenant');
    }

    return this.routeOptimizationService.optimizeRoute(tenantId, request);
  }

  async createAlert(tenantId: string, alert: Omit<AiAlert, 'id' | 'tenantId' | 'createdAt'>): Promise<AiAlert> {
    return this.alertService.createAlert(tenantId, alert);
  }

  async getSettings(tenantId: string): Promise<LogisticsAiSettings | null> {
    return this.settingsService.getSettings(tenantId);
  }

  async updateSettings(tenantId: string, settings: Partial<LogisticsAiSettings>): Promise<LogisticsAiSettings> {
    return this.settingsService.updateSettings(tenantId, settings);
  }

  async logDecision(tenantId: string, log: Omit<AiDecisionLog, 'id' | 'tenantId' | 'createdAt'>): Promise<AiDecisionLog> {
    return this.settingsService.logDecision(tenantId, log);
  }

  private async createDelayAlert(tenantId: string, prediction: DelayPrediction): Promise<void> {
    const severity = prediction.predictedDelay === 'high' ? 'critical' : 
                    prediction.predictedDelay === 'medium' ? 'warning' : 'info';

    await this.createAlert(tenantId, {
      type: 'delay_prediction',
      severity,
      title: `Previsão de Atraso - ${prediction.predictedDelay.toUpperCase()}`,
      message: `Pedido ${prediction.orderId} pode atrasar ${prediction.delayMinutesEstimate} minutos. Confiança: ${(prediction.confidenceScore * 100).toFixed(0)}%`,
      entityId: prediction.orderId,
      entityType: 'order',
      actionRequired: prediction.predictedDelay === 'high',
      actionUrl: `/orders/${prediction.orderId}`,
      isRead: false,
    });
  }

  private async createRouteSuggestionAlert(tenantId: string, suggestions: RouteSuggestion[]): Promise<void> {
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
    
    if (highPrioritySuggestions.length > 0) {
      await this.createAlert(tenantId, {
        type: 'route_suggestion',
        severity: 'warning',
        title: 'Sugestões de Rota Disponíveis',
        message: `${highPrioritySuggestions.length} sugestões(ões) de otimização de rota disponíveis para revisão`,
        actionRequired: true,
        actionUrl: '/logistics-ai/suggestions',
        isRead: false,
      });
    }
  }
}
