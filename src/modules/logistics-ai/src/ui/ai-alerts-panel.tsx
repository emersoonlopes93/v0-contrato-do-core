import React, { useState } from 'react';
import type { AiAlert } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  ExternalLink,
  Clock
} from 'lucide-react';

interface AiAlertsPanelProps {
  alerts: AiAlert[];
  unreadCount: number;
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (alertId: string) => void;
  loading?: boolean;
  maxVisible?: number;
}

export function AiAlertsPanel({
  alerts,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  loading = false,
  maxVisible = 10
}: AiAlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'warning' | 'critical'>('all');

  const getAlertIcon = (type: AiAlert['type']) => {
    switch (type) {
      case 'delay_prediction':
        return Clock;
      case 'route_suggestion':
        return AlertTriangle;
      case 'eta_update':
        return Info;
      case 'driver_performance':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getSeverityColor = (severity: AiAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'info' || filter === 'warning' || filter === 'critical') {
      return alert.severity === filter;
    }
    return true;
  }).slice(0, maxVisible);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours} h atrás`;
    return `${days} dias atrás`;
  };

  return (
    <Card className="w-full max-h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle className="text-lg">
              Alertas IA
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              disabled={loading}
            >
              Marcar todos como lidos
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos ({alerts.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Não lidos ({unreadCount})
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('critical')}
          >
            Críticos
          </Button>
          <Button
            variant={filter === 'warning' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('warning')}
          >
            Avisos
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-64">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      !alert.isRead 
                        ? 'bg-muted/50 border-muted-foreground/20' 
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{alert.title}</h4>
                            <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatTime(alert.createdAt)}</span>
                            {alert.actionRequired && (
                              <span className="text-orange-600 font-medium">
                                Ação necessária
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {alert.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(alert.actionUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead(alert.id)}
                            disabled={loading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(alert.id)}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
