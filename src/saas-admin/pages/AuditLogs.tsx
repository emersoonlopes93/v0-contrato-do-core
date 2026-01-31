import React from 'react';
import { adminApi } from '../lib/adminApi';

interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  status: string;
  timestamp: string;
}

export function AdminAuditLogsPage() {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    tenant: '',
    user: '',
    action: '',
    date: '',
  });

  async function fetchEvents() {
    setLoading(true);
    
    // Filtrar apenas campos preenchidos
    const params: Record<string, string> = {};
    if (filters.tenant) params.tenant = filters.tenant;
    if (filters.user) params.user = filters.user;
    if (filters.action) params.action = filters.action;
    if (filters.date) params.date = filters.date;

    try {
      const data = await adminApi.get<AuditEvent[]>('/audit', params);
      setEvents(data);
    } catch (error: unknown) {
      console.error('Failed to load audit events', error);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <div className="rounded bg-white p-4 shadow space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            placeholder="Tenant"
            value={filters.tenant}
            onChange={(e) => setFilters({ ...filters, tenant: e.target.value })}
            className="rounded border px-3 py-2"
          />
          <input
            placeholder="Usuário"
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            className="rounded border px-3 py-2"
          />
          <input
            placeholder="Ação"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="rounded border px-3 py-2"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="rounded border px-3 py-2"
          />
        </div>
        <button
          onClick={fetchEvents}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          style={{ minHeight: 44 }}
        >
          Filtrar
        </button>
      </div>
      <div className="rounded bg-white shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-muted-foreground">Sem eventos</p>
        ) : (
          <ul>
            {events.map((e) => (
              <li key={e.id} className="border-t p-4">
                <div className="font-medium">{e.action}</div>
                <div className="text-sm text-muted-foreground">
                  {e.resource} • {e.status} • {new Date(e.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
