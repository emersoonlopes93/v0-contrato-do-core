import React from 'react';
import type { PredictedDelay } from '../types';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface DelayPredictionBadgeProps {
  predictedDelay: PredictedDelay;
  delayMinutes?: number;
  confidenceScore?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DelayPredictionBadge({
  predictedDelay,
  delayMinutes,
  confidenceScore,
  showDetails = false,
  size = 'md'
}: DelayPredictionBadgeProps) {
  const getDelayConfig = (delay: PredictedDelay) => {
    switch (delay) {
      case 'none':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Sem Atraso',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'low':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Atraso Baixo',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'medium':
        return {
          variant: 'outline' as const,
          icon: AlertTriangle,
          label: 'Atraso Médio',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'high':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          label: 'Atraso Alto',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
    }
  };

  const config = getDelayConfig(predictedDelay);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant} 
        className={`${sizeClasses[size]} ${config.bgColor} ${config.color} border-current/20`}
      >
        <Icon className={`${iconSizes[size]} mr-1`} />
        {config.label}
      </Badge>
      
      {showDetails && (
        <div className="flex flex-col text-xs text-muted-foreground">
          {delayMinutes !== undefined && (
            <span>{delayMinutes} min estimado</span>
          )}
          {confidenceScore !== undefined && (
            <span>{Math.round(confidenceScore * 100)}% confiança</span>
          )}
        </div>
      )}
    </div>
  );
}
