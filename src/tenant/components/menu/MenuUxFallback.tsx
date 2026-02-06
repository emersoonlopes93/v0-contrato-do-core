'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useMenuUxMode } from '../../hooks/useMenuUxMode';

interface MenuUxFallbackProps {
  error?: Error;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Componente de fallback para garantir que a UX iFood nunca quebre o sistema
 * Se houver erro, volta automaticamente para o modo classic
 */
export function MenuUxFallback({ error, onRetry, children }: MenuUxFallbackProps) {
  const { mode, setMode } = useMenuUxMode();

  const handleFallbackToClassic = () => {
    setMode('classic');
    if (onRetry) onRetry();
  };

  // Se não houver erro, renderiza normalmente
  if (!error) {
    return <>{children}</>;
  }

  // Se houver erro e estiver no modo iFood, faz fallback
  if (mode === 'ifood') {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                A UX iFood encontrou um problema e foi desativada temporariamente.
              </p>
              <p className="text-sm opacity-90">
                {error.message || 'Ocorreu um erro inesperado ao renderizar a interface avançada.'}
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFallbackToClassic}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Voltar para modo classic
                </Button>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Renderiza o conteúdo em modo classic como fallback */}
        <div className="opacity-75">
          {children}
        </div>
      </div>
    );
  }

  // Se já estiver em modo classic, renderiza o erro normalmente
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Ocorreu um erro ao carregar o módulo de cardápio.</p>
          <p className="text-sm opacity-90">{error.message}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
