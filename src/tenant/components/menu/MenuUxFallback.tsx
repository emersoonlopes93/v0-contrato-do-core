'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MenuUxFallbackProps {
  error?: Error;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function MenuUxFallback({ error, onRetry, children }: MenuUxFallbackProps) {
  // Se não houver erro, renderiza normalmente
  if (!error) {
    return <>{children}</>;
  }

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
