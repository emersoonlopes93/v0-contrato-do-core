import { useState, useEffect, useCallback } from 'react';
import type { LogisticsAiSettings } from '../types';
import { SettingsService } from '../services/settings.service';

interface UseLogisticsSettingsReturn {
  settings: LogisticsAiSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<LogisticsAiSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  toggleDelayPrediction: () => Promise<void>;
  toggleRouteOptimization: () => Promise<void>;
  toggleAutoAlerts: () => Promise<void>;
  updateConfidenceThreshold: (threshold: number) => Promise<void>;
}

export function useLogisticsSettings(tenantId: string): UseLogisticsSettingsReturn {
  const [settings, setSettings] = useState<LogisticsAiSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settingsService = new SettingsService();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedSettings = await settingsService.getSettings(tenantId);
      setSettings(fetchedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar configurações');
    } finally {
      setLoading(false);
    }
  }, [tenantId, settingsService]);

  const updateSettings = useCallback(async (updates: Partial<LogisticsAiSettings>) => {
    if (!settings) return;

    setLoading(true);
    setError(null);

    try {
      const updatedSettings = await settingsService.updateSettings(tenantId, updates);
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  }, [tenantId, settings, settingsService]);

  const resetToDefaults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const defaultSettings = await settingsService.resetToDefaults(tenantId);
      setSettings(defaultSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir configurações');
    } finally {
      setLoading(false);
    }
  }, [tenantId, settingsService]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const toggleDelayPrediction = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ delayPredictionEnabled: !settings.delayPredictionEnabled });
  }, [settings, updateSettings]);

  const toggleRouteOptimization = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ routeOptimizationEnabled: !settings.routeOptimizationEnabled });
  }, [settings, updateSettings]);

  const toggleAutoAlerts = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ autoAlertsEnabled: !settings.autoAlertsEnabled });
  }, [settings, updateSettings]);

  const updateConfidenceThreshold = useCallback(async (threshold: number) => {
    if (!settings) return;
    const clampedThreshold = Math.max(0.1, Math.min(1.0, threshold));
    await updateSettings({ confidenceThreshold: clampedThreshold });
  }, [settings, updateSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    return () => {
      setSettings(null);
      setError(null);
    };
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    refreshSettings,
    toggleDelayPrediction,
    toggleRouteOptimization,
    toggleAutoAlerts,
    updateConfidenceThreshold,
  };
}
