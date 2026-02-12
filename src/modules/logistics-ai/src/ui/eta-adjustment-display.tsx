import React from 'react';
import type { DelayPrediction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Target
} from 'lucide-react';

interface EtaAdjustmentDisplayProps {
  originalEta: Date;
  predictedEta: Date;
  prediction: DelayPrediction | null;
  showFactors?: boolean;
  compact?: boolean;
}

export function EtaAdjustmentDisplay({
  originalEta,
  predictedEta,
  prediction,
  showFactors = false,
  compact = false
}: EtaAdjustmentDisplayProps) {
  const delayMinutes = Math.round((predictedEta.getTime() - originalEta.getTime()) / 60000);
  const isDelay = delayMinutes > 0;
  const isImprovement = delayMinutes < 0;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return 'text-green-600';
    if (delay <= 15) return 'text-yellow-600';
    if (delay <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDelayIcon = (delay: number) => {
    if (delay <= 0) return TrendingDown;
    if (delay <= 15) return Clock;
    if (delay <= 30) return AlertTriangle;
    return AlertTriangle;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const DelayIcon = getDelayIcon(delayMinutes);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border">
        <DelayIcon className={`w-5 h-5 ${getDelayColor(delayMinutes)}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">ETA Ajustado:</span>
            <span className={`font-bold ${getDelayColor(delayMinutes)}`}>
              {formatTime(predictedEta)}
            </span>
            {isDelay && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                +{delayMinutes} min
              </Badge>
            )}
            {isImprovement && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                {Math.abs(delayMinutes)} min antes
              </Badge>
            )}
          </div>
          {prediction && (
            <div className="text-xs text-muted-foreground">
              Confiança: {Math.round(prediction.confidenceScore * 100)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Ajuste de ETA - Previsão Inteligente
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>ETA Original</span>
            </div>
            <div className="text-lg font-semibold">
              {formatTime(originalEta)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>ETA Previsto</span>
            </div>
            <div className={`text-lg font-semibold ${getDelayColor(delayMinutes)}`}>
              {formatTime(predictedEta)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <DelayIcon className={`w-6 h-6 ${getDelayColor(delayMinutes)}`} />
            <div>
              <div className="font-medium">
                {isDelay ? `Atraso de ${delayMinutes} minutos` : 
                 isImprovement ? `${Math.abs(delayMinutes)} minutos antes do previsto` :
                 'Sem alteração no tempo'}
              </div>
              <div className="text-sm text-muted-foreground">
                Baseado em análise de múltiplos fatores
              </div>
            </div>
          </div>

          {prediction && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Confiança</div>
              <div className={`font-semibold ${getConfidenceColor(prediction.confidenceScore)}`}>
                {Math.round(prediction.confidenceScore * 100)}%
              </div>
            </div>
          )}
        </div>

        {prediction && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4" />
              Fatores Considerados
            </div>
            <Progress 
              value={prediction.confidenceScore * 100} 
              className="h-2"
            />
            <div className="flex flex-wrap gap-2">
              {prediction.factors.map((factor, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                >
                  {factor.description}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {prediction && showFactors && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Análise de Fatores</div>
            <div className="space-y-2">
              {prediction.factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">{factor.description}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(factor.weight * 100)}% peso
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
