import { useState, useEffect, useCallback } from 'react';
import type { AiAlert } from '../types';
import { AlertService } from '../services';

interface UseAiAlertsReturn {
  alerts: AiAlert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchAlerts: (options?: {
    unreadOnly?: boolean;
    type?: string;
    severity?: string;
    limit?: number;
  }) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  clearAlerts: () => void;
  getAlertsBySeverity: (severity: 'info' | 'warning' | 'critical') => AiAlert[];
  getAlertsByType: (type: string) => AiAlert[];
}

export function useAiAlerts(tenantId: string): UseAiAlertsReturn {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alertService = new AlertService();

  const fetchAlerts = useCallback(async (options?: {
    unreadOnly?: boolean;
    type?: string;
    severity?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedAlerts = await alertService.getAlerts(tenantId, options);
      setAlerts(fetchedAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar alertas');
    } finally {
      setLoading(false);
    }
  }, [tenantId, alertService]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await alertService.markAsRead(tenantId, alertId);
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, isRead: true }
            : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar alerta como lido');
    }
  }, [tenantId, alertService]);

  const markAllAsRead = useCallback(async () => {
    try {
      await alertService.markAllAsRead(tenantId);
      setAlerts(prev => 
        prev.map(alert => ({ ...alert, isRead: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar todos os alertas como lidos');
    }
  }, [tenantId, alertService]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      await alertService.deleteAlert(tenantId, alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar alerta');
    }
  }, [tenantId, alertService]);

  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setError(null);
  }, []);

  const getAlertsBySeverity = useCallback((severity: 'info' | 'warning' | 'critical') => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  const getAlertsByType = useCallback((type: string) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  useEffect(() => {
    const interval = setInterval(async () => {
      await alertService.cleanupExpiredAlerts(tenantId);
      await fetchAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tenantId, alertService, fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    return () => {
      setAlerts([]);
      setError(null);
    };
  }, []);

  return {
    alerts,
    unreadCount,
    loading,
    error,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    refreshAlerts,
    clearAlerts,
    getAlertsBySeverity,
    getAlertsByType,
  };
}
