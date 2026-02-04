import React from 'react';
import { adminApi } from '../lib/adminApi';

interface Plan {
  id: string;
  name: string;
  description: string;
  modules: string[];
  limits: Record<string, number>;
  status: string;
}

export function AdminPlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  async function fetchPlans() {
    setLoading(true);
    try {
      const data = await adminApi.get<Plan[]>('/plans');
      setPlans(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar planos';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Plans</h1>
      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      <div className="rounded bg-card shadow-md">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : plans.length === 0 ? (
          <p className="p-4 text-muted-foreground">Nenhum plano</p>
        ) : (
          <ul>
            {plans.map((p) => (
              <li key={p.id} className="border-t p-4">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.description}</div>
                <div className="mt-2">
                  <div className="text-sm">Módulos permitidos: {p.modules.join(', ') || '—'}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
