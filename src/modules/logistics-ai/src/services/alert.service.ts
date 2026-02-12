import type { AiAlert } from '../types';
import { LogisticsAiLogger } from '../utils/logistics-ai.logger';

export class AlertService {
  private alerts: Map<string, AiAlert[]> = new Map();

  async createAlert(tenantId: string, alert: Omit<AiAlert, 'id' | 'tenantId' | 'createdAt'>): Promise<AiAlert> {
    const newAlert: AiAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      ...alert,
      createdAt: new Date(),
    };

    const tenantAlerts = this.alerts.get(tenantId) || [];
    tenantAlerts.push(newAlert);
    this.alerts.set(tenantId, tenantAlerts);

    LogisticsAiLogger.info(tenantId, 'Alert created', {
      decisionType: 'alert_creation',
      metadata: {
        alertId: newAlert.id,
        type: newAlert.type,
        severity: newAlert.severity
      }
    });
    
    return newAlert;
  }

  async getAlerts(tenantId: string, options?: {
    unreadOnly?: boolean;
    type?: string;
    severity?: string;
    limit?: number;
  }): Promise<AiAlert[]> {
    const tenantAlerts = this.alerts.get(tenantId) || [];
    
    let filteredAlerts = tenantAlerts;

    if (options?.unreadOnly) {
      filteredAlerts = filteredAlerts.filter(alert => !alert.isRead);
    }

    if (options?.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === options.type);
    }

    if (options?.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === options.severity);
    }

    filteredAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      filteredAlerts = filteredAlerts.slice(0, options.limit);
    }

    return filteredAlerts;
  }

  async markAsRead(tenantId: string, alertId: string): Promise<boolean> {
    const tenantAlerts = this.alerts.get(tenantId);
    if (!tenantAlerts) return false;

    const alert = tenantAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.isRead = true;
    return true;
  }

  async markAllAsRead(tenantId: string): Promise<number> {
    const tenantAlerts = this.alerts.get(tenantId);
    if (!tenantAlerts) return 0;

    const unreadCount = tenantAlerts.filter(alert => !alert.isRead).length;
    tenantAlerts.forEach(alert => {
      alert.isRead = true;
    });

    return unreadCount;
  }

  async deleteAlert(tenantId: string, alertId: string): Promise<boolean> {
    const tenantAlerts = this.alerts.get(tenantId);
    if (!tenantAlerts) return false;

    const index = tenantAlerts.findIndex(alert => alert.id === alertId);
    if (index === -1) return false;

    tenantAlerts.splice(index, 1);
    return true;
  }

  async getUnreadCount(tenantId: string): Promise<number> {
    const tenantAlerts = this.alerts.get(tenantId) || [];
    return tenantAlerts.filter(alert => !alert.isRead).length;
  }

  async cleanupExpiredAlerts(tenantId: string): Promise<number> {
    const tenantAlerts = this.alerts.get(tenantId);
    if (!tenantAlerts) return 0;

    const now = new Date();
    const initialLength = tenantAlerts.length;

    const activeAlerts = tenantAlerts.filter(alert => {
      if (!alert.expiresAt) return true;
      return alert.expiresAt > now;
    });

    this.alerts.set(tenantId, activeAlerts);
    return initialLength - activeAlerts.length;
  }
}
