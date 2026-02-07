import React from 'react';
import { adminApi } from '@/src/saas-admin/lib/adminApi';
import { toast } from '@/hooks/use-toast';
import { Shield, Search, Calendar, Filter, Clock, User, Tag } from 'lucide-react';
import type { SaaSAdminAuditEventDTO } from '@/src/types/saas-admin';

export function AdminAuditLogsPage() {
  const [events, setEvents] = React.useState<SaaSAdminAuditEventDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    tenant: '',
    user: '',
    action: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    
    const params: Record<string, string> = {};
    if (filters.tenant) params.tenant = filters.tenant;
    if (filters.user) params.user = filters.user;
    if (filters.action) params.action = filters.action;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    try {
      const data = await adminApi.get<SaaSAdminAuditEventDTO[]>('/audit', params);
      setEvents(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar eventos';
      toast({ title: 'Erro ao carregar auditoria', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const statusStyles = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-info/10 text-info border-info/20',
    default: 'bg-muted text-muted-foreground border-border/40',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          Auditoria & Logs
        </h1>
        <p className="text-muted-foreground mt-1">Monitoramento completo das ações críticas do SaaS</p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros avançados
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Tenant"
                value={filters.tenant}
                onChange={(e) => setFilters({ ...filters, tenant: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Usuário"
                value={filters.user}
                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Tipo de ação"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
              >
                <option value="all">Todos os status</option>
                <option value="success">Sucesso</option>
                <option value="warning">Atenção</option>
                <option value="error">Erro</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/40 bg-background/50 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchEvents}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            >
              Atualizar
            </button>
            <span className="text-sm text-muted-foreground">{events.length} eventos encontrados</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
        <div className="border-b border-border/40 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Linha do tempo
          </h2>
        </div>
        {loading ? (
          <div className="p-6 text-muted-foreground">Carregando...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-muted-foreground">Sem eventos</div>
        ) : (
          <div className="p-6">
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border/60" />
              <div className="space-y-6">
                {events.map((event) => {
                  const statusKey = event.status in statusStyles ? event.status : 'default';
                  const badgeClasses = statusStyles[statusKey as keyof typeof statusStyles];
                  return (
                    <div key={event.id} className="relative">
                      <div className="absolute left-0 top-2 h-3 w-3 rounded-full bg-primary" />
                      <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{event.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">{event.resource}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClasses}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Usuário: {event.userId}</span>
                          <span>Tenant: {event.tenantId ?? '-'}</span>
                          <span>{new Date(event.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
