import { useState, useEffect } from 'react';
import type { ExecutiveDashboardDTO } from '../types';

export function useDashboardExecutivo(period: '7d' | '30d' | 'custom' = '30d') {
  const [data, setData] = useState<ExecutiveDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        // Assumindo que o token de autenticação é tratado via cookie ou interceptor global
        // Se precisar de cabeçalho explícito, podemos pegar do contexto de sessão
        const response = await fetch(`/api/dashboard/executivo?period=${period}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Context': 'tenant_user',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao carregar dashboard: ${response.statusText}`);
        }

        const result = await response.json();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [period]);

  return { data, loading, error };
}
