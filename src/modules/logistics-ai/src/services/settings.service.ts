import type { LogisticsAiSettings, AiDecisionLog } from '../types';
import { LogisticsAiLogger } from '../utils/logistics-ai.logger';

export class SettingsService {
  private settings: Map<string, LogisticsAiSettings> = new Map();
  private decisionLogs: Map<string, AiDecisionLog[]> = new Map();

  async getSettings(tenantId: string): Promise<LogisticsAiSettings | null> {
    return this.settings.get(tenantId) || this.createDefaultSettings(tenantId);
  }

  async updateSettings(tenantId: string, settingsUpdate: Partial<LogisticsAiSettings>): Promise<LogisticsAiSettings> {
    const currentSettings = await this.getSettings(tenantId);
    if (!currentSettings) {
      throw new Error(`Settings not found for tenant ${tenantId}`);
    }

    const updatedSettings: LogisticsAiSettings = {
      ...currentSettings,
      ...settingsUpdate,
      id: currentSettings.id,
      tenantId: currentSettings.tenantId,
      updatedAt: new Date(),
    };

    this.settings.set(tenantId, updatedSettings);
    return updatedSettings;
  }

  async logDecision(tenantId: string, log: Omit<AiDecisionLog, 'id' | 'tenantId' | 'createdAt'>): Promise<AiDecisionLog> {
    const decisionLog: AiDecisionLog = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      ...log,
      createdAt: new Date(),
    };

    const tenantLogs = this.decisionLogs.get(tenantId) || [];
    tenantLogs.push(decisionLog);
    this.decisionLogs.set(tenantId, tenantLogs);

    LogisticsAiLogger.info(tenantId, 'AI Decision logged', {
      decisionType: 'decision_logging',
      metadata: {
        decisionId: decisionLog.id,
        decisionType: decisionLog.decisionType,
        confidence: decisionLog.confidence
      }
    });
    
    return decisionLog;
  }

  async getDecisionLogs(tenantId: string, options?: {
    decisionType?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AiDecisionLog[]> {
    const tenantLogs = this.decisionLogs.get(tenantId) || [];
    
    let filteredLogs = tenantLogs;

    if (options?.decisionType) {
      filteredLogs = filteredLogs.filter(log => log.decisionType === options.decisionType);
    }

    if (options?.startDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt >= options.startDate!);
    }

    if (options?.endDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt <= options.endDate!);
    }

    filteredLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  async getDecisionStats(tenantId: string, days: number = 30): Promise<{
    totalDecisions: number;
    decisionsByType: Record<string, number>;
    averageConfidence: number;
    averageProcessingTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getDecisionLogs(tenantId, { startDate });
    
    const decisionsByType: Record<string, number> = {};
    let totalConfidence = 0;
    let totalProcessingTime = 0;

    logs.forEach(log => {
      decisionsByType[log.decisionType] = (decisionsByType[log.decisionType] || 0) + 1;
      totalConfidence += log.confidence;
      totalProcessingTime += log.processingTimeMs;
    });

    return {
      totalDecisions: logs.length,
      decisionsByType,
      averageConfidence: logs.length > 0 ? totalConfidence / logs.length : 0,
      averageProcessingTime: logs.length > 0 ? totalProcessingTime / logs.length : 0,
    };
  }

  private createDefaultSettings(tenantId: string): LogisticsAiSettings {
    const defaultSettings: LogisticsAiSettings = {
      id: `settings_${tenantId}`,
      tenantId,
      delayPredictionEnabled: true,
      routeOptimizationEnabled: true,
      autoAlertsEnabled: true,
      confidenceThreshold: 0.7,
      predictionHorizonMinutes: 60,
      maxSuggestionsPerDriver: 5,
      workingHoursEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.settings.set(tenantId, defaultSettings);
    return defaultSettings;
  }

  async resetToDefaults(tenantId: string): Promise<LogisticsAiSettings> {
    const defaultSettings = this.createDefaultSettings(tenantId);
    this.settings.set(tenantId, defaultSettings);
    return defaultSettings;
  }

  async exportSettings(tenantId: string): Promise<LogisticsAiSettings & { decisionLogs: AiDecisionLog[] }> {
    const settings = await this.getSettings(tenantId);
    const decisionLogs = this.decisionLogs.get(tenantId) || [];

    if (!settings) {
      throw new Error(`Settings not found for tenant ${tenantId}`);
    }

    return {
      ...settings,
      decisionLogs,
    };
  }
}
