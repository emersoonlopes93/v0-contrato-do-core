import { useState, useEffect, useCallback } from 'react';
import type { DelayPrediction } from '../types';
import { LogisticsAiService } from '../services';

interface UseDelayPredictionsReturn {
  predictions: DelayPrediction[];
  loading: boolean;
  error: string | null;
  fetchPrediction: (orderId: string) => Promise<void>;
  fetchPredictions: (orderIds: string[]) => Promise<void>;
  refreshPredictions: () => Promise<void>;
  clearPredictions: () => void;
}

export function useDelayPredictions(tenantId: string): UseDelayPredictionsReturn {
  const [predictions, setPredictions] = useState<DelayPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logisticsService = new LogisticsAiService();

  const fetchPrediction = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const prediction = await logisticsService.predictDelay(tenantId, orderId);
      
      if (prediction) {
        setPredictions(prev => {
          const existing = prev.findIndex(p => p.orderId === orderId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = prediction;
            return updated;
          }
          return [...prev, prediction];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar previsão de atraso');
    } finally {
      setLoading(false);
    }
  }, [tenantId, logisticsService]);

  const fetchPredictions = useCallback(async (orderIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const predictionPromises = orderIds.map(orderId => 
        logisticsService.predictDelay(tenantId, orderId)
      );
      
      const results = await Promise.all(predictionPromises);
      const validPredictions = results.filter((p): p is DelayPrediction => p !== null);
      
      setPredictions(validPredictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar previsões de atraso');
    } finally {
      setLoading(false);
    }
  }, [tenantId, logisticsService]);

  const refreshPredictions = useCallback(async () => {
    if (predictions.length === 0) return;
    
    const orderIds = predictions.map(p => p.orderId);
    await fetchPredictions(orderIds);
  }, [predictions, fetchPredictions]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      setPredictions([]);
      setError(null);
    };
  }, []);

  return {
    predictions,
    loading,
    error,
    fetchPrediction,
    fetchPredictions,
    refreshPredictions,
    clearPredictions,
  };
}
