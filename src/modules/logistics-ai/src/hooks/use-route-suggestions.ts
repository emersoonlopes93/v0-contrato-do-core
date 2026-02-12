import { useState, useEffect, useCallback } from 'react';
import type { RouteSuggestion } from '../types';
import { LogisticsAiService } from '../services';

interface UseRouteSuggestionsReturn {
  suggestions: RouteSuggestion[];
  loading: boolean;
  error: string | null;
  fetchSuggestions: (driverId: string) => Promise<void>;
  approveSuggestion: (suggestionId: string) => Promise<void>;
  rejectSuggestion: (suggestionId: string) => Promise<void>;
  refreshSuggestions: (driverId: string) => Promise<void>;
  clearSuggestions: () => void;
  getSuggestionsByPriority: (priority: 'low' | 'medium' | 'high') => RouteSuggestion[];
  getSuggestionsByType: (type: 'reorder_stops' | 'change_driver' | 'alternative_route') => RouteSuggestion[];
}

export function useRouteSuggestions(tenantId: string): UseRouteSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logisticsService = new LogisticsAiService();

  const fetchSuggestions = useCallback(async (driverId: string) => {
    setLoading(true);
    setError(null);

    try {
      const routeSuggestions = await logisticsService.generateRouteSuggestions(tenantId, driverId);
      setSuggestions(routeSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar sugestões de rota');
    } finally {
      setLoading(false);
    }
  }, [tenantId, logisticsService]);

  const approveSuggestion = useCallback(async (suggestionId: string) => {
    try {
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.id === suggestionId 
            ? { ...suggestion, status: 'approved' as const }
            : suggestion
        )
      );

      console.log(`Sugestão ${suggestionId} aprovada e implementada`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar sugestão');
    }
  }, []);

  const rejectSuggestion = useCallback(async (suggestionId: string) => {
    try {
      setSuggestions(prev => 
        prev.map(suggestion => 
          suggestion.id === suggestionId 
            ? { ...suggestion, status: 'rejected' as const }
            : suggestion
        )
      );

      console.log(`Sugestão ${suggestionId} rejeitada`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar sugestão');
    }
  }, []);

  const refreshSuggestions = useCallback(async (driverId: string) => {
    await fetchSuggestions(driverId);
  }, [fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const getSuggestionsByPriority = useCallback((priority: 'low' | 'medium' | 'high') => {
    return suggestions.filter(suggestion => suggestion.priority === priority);
  }, [suggestions]);

  const getSuggestionsByType = useCallback((type: 'reorder_stops' | 'change_driver' | 'alternative_route') => {
    return suggestions.filter(suggestion => suggestion.type === type);
  }, [suggestions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestions(prev => 
        prev.map(suggestion => {
          if (suggestion.expiresAt < new Date() && suggestion.status === 'pending') {
            return { ...suggestion, status: 'expired' as const };
          }
          return suggestion;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      setSuggestions([]);
      setError(null);
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    approveSuggestion,
    rejectSuggestion,
    refreshSuggestions,
    clearSuggestions,
    getSuggestionsByPriority,
    getSuggestionsByType,
  };
}
