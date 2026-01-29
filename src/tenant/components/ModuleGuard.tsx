'use client';

import type { ReactNode } from 'react';
import { useSession } from '../context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Module Guard - Route-level Protection
 * 
 * RESPONSIBILITIES:
 * - Verify module is active for tenant (runtime check)
 * - Show graceful fallback if module disabled
 * - Composable with auth guards
 * 
 * RULES:
 * - No hardcoded modules
 * - Checks activeModules from SessionContext (fetched from API)
 * - No assumptions about module availability
 * - Graceful degradation
 */

interface ModuleGuardProps {
  moduleId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModuleGuard({ moduleId, children, fallback }: ModuleGuardProps) {
  const { isModuleEnabled, isLoading, isRefreshing } = useSession();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Verificando módulos...</p>
      </div>
    );
  }

  // Module not enabled
  if (!isModuleEnabled(moduleId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ModuleDisabledFallback moduleId={moduleId} />;
  }

  // Module enabled - render children
  return (
    <>
      {isRefreshing && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Atualizando módulos...
        </div>
      )}
      {children}
    </>
  );
}

function ModuleDisabledFallback({ moduleId }: { moduleId: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            <CardTitle>Módulo Não Disponível</CardTitle>
          </div>
          <CardDescription>
            O módulo <strong>{moduleId}</strong> não está habilitado para este tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entre em contato com o administrador para ativar este módulo.
          </p>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => (window.location.href = '/tenant')}
          >
            Voltar para Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Permission Guard - Opaque Permission Check
 * 
 * RULES:
 * - Permissions are opaque strings
 * - No client-side logic to infer permissions
 * - Permissions come from API (in token/session)
 */

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { hasPermission, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Você não tem permissão para acessar este recurso.
      </div>
    );
  }

  return <>{children}</>;
}
