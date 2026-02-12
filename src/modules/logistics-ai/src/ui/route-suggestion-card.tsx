import React from 'react';
import type { RouteSuggestion } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRightLeft, 
  Users, 
  Route, 
  Clock, 
  MapPin, 
  TrendingDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface RouteSuggestionCardProps {
  suggestion: RouteSuggestion;
  onApprove?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  showActions?: boolean;
}

export function RouteSuggestionCard({
  suggestion,
  onApprove,
  onReject,
  showActions = true
}: RouteSuggestionCardProps) {
  const getSuggestionIcon = (type: RouteSuggestion['type']) => {
    switch (type) {
      case 'reorder_stops':
        return ArrowRightLeft;
      case 'change_driver':
        return Users;
      case 'alternative_route':
        return Route;
    }
  };

  const getPriorityColor = (priority: RouteSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  const getStatusIcon = (status: RouteSuggestion['status']) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return null;
    }
  };

  const Icon = getSuggestionIcon(suggestion.type);
  const StatusIcon = getStatusIcon(suggestion.status);
  const isExpired = suggestion.expiresAt < new Date();

  return (
    <Card className={`w-full ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">{suggestion.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(suggestion.priority)}>
              {suggestion.priority}
            </Badge>
            {StatusIcon && (
              <StatusIcon className={`w-5 h-5 ${
                suggestion.status === 'approved' ? 'text-green-600' : 'text-red-600'
              }`} />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {suggestion.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Redução de Tempo</p>
              <p className="font-semibold text-blue-600">
                -{suggestion.estimatedImprovement.timeReductionMinutes} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Redução de Distância</p>
              <p className="font-semibold text-green-600">
                -{suggestion.estimatedImprovement.distanceReductionKm.toFixed(1)} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Redução de Risco</p>
              <p className="font-semibold text-orange-600">
                -{Math.round(suggestion.estimatedImprovement.delayRiskReduction * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span>Confiança: </span>
            <span className="font-semibold">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>

          {isExpired && (
            <Badge variant="outline" className="text-red-600 border-red-200">
              Expirado
            </Badge>
          )}
        </div>

        {showActions && suggestion.status === 'pending' && !isExpired && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onApprove?.(suggestion.id)}
              size="sm"
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
            <Button
              onClick={() => onReject?.(suggestion.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
