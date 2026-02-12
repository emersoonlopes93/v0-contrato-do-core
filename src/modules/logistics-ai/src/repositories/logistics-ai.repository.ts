export interface LogisticsAiDecisionLogRecord {
  id: string;
  tenantId: string;
  orderId?: string;
  type: 'delay' | 'route' | 'alert';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  confidenceScore: number;
  fallbackUsed: boolean;
  createdAt: Date;
}

export class LogisticsAiRepository {
  private static instance: LogisticsAiRepository;
  private logs: Map<string, LogisticsAiDecisionLogRecord[]> = new Map();

  static getInstance(): LogisticsAiRepository {
    if (!LogisticsAiRepository.instance) {
      LogisticsAiRepository.instance = new LogisticsAiRepository();
    }
    return LogisticsAiRepository.instance;
  }

  async saveDecisionLog(log: Omit<LogisticsAiDecisionLogRecord, 'id' | 'createdAt'>): Promise<LogisticsAiDecisionLogRecord> {
    const logRecord: LogisticsAiDecisionLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ...log
    };

    const tenantLogs = this.logs.get(log.tenantId) || [];
    tenantLogs.push(logRecord);
    this.logs.set(log.tenantId, tenantLogs);

    // Simulate async database operation
    await new Promise(resolve => setTimeout(resolve, 0));

    return logRecord;
  }

  async getDecisionLogs(tenantId: string, options?: {
    type?: 'delay' | 'route' | 'alert';
    orderId?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LogisticsAiDecisionLogRecord[]> {
    const tenantLogs = this.logs.get(tenantId) || [];
    
    let filteredLogs = tenantLogs;

    if (options?.type) {
      filteredLogs = filteredLogs.filter(log => log.type === options.type);
    }

    if (options?.orderId) {
      filteredLogs = filteredLogs.filter(log => log.orderId === options.orderId);
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
    fallbackRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getDecisionLogs(tenantId, { startDate });
    
    const decisionsByType: Record<string, number> = {};
    let totalConfidence = 0;
    let fallbackCount = 0;

    logs.forEach(log => {
      decisionsByType[log.type] = (decisionsByType[log.type] || 0) + 1;
      totalConfidence += log.confidenceScore;
      if (log.fallbackUsed) fallbackCount++;
    });

    return {
      totalDecisions: logs.length,
      decisionsByType,
      averageConfidence: logs.length > 0 ? totalConfidence / logs.length : 0,
      fallbackRate: logs.length > 0 ? fallbackCount / logs.length : 0
    };
  }

  async cleanupOldLogs(tenantId: string, daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const tenantLogs = this.logs.get(tenantId) || [];
    const initialLength = tenantLogs.length;

    const activeLogs = tenantLogs.filter(log => log.createdAt >= cutoffDate);
    this.logs.set(tenantId, activeLogs);

    return initialLength - activeLogs.length;
  }

  async deleteTenantLogs(tenantId: string): Promise<number> {
    const logs = this.logs.get(tenantId) || [];
    const count = logs.length;
    this.logs.delete(tenantId);
    return count;
  }
}
