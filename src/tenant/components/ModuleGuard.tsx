'use client';

import type { ReactNode } from 'react';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { ModuleGuardProps, PermissionGuardProps } from '@/src/types/tenant';

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

export function ModuleGuard({ moduleId, children, fallback }: ModuleGuardProps) {
  const { activeModules, isLoading } = useSession();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Verificando módulos...</p>
      </div>
    );
  }

  // Module not enabled
  if (!activeModules.includes(moduleId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ModuleDisabledFallback moduleId={moduleId} />;
  }

  return <>{children}</>;
}

function ModuleDisabledFallback({ moduleId }: { moduleId: string }) {
  const { tenantSlug } = useTenant();
  const basePath = `/tenant/${tenantSlug}/dashboard`;
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-warning" />
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
            onClick={() => (window.location.href = basePath)}
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
      <div className="rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
        Você não tem permissão para acessar este recurso.
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * HOC: withModuleGuard
 * Wraps a component with ModuleGuard protection
 */
export function withModuleGuard<P extends object>(
  Component: React.ComponentType<P>,
  moduleId: string,
  fallback?: ReactNode
) {
  return function WithModuleGuardWrapper(props: P) {
    return (
      <ModuleGuard moduleId={moduleId} fallback={fallback}>
        <Component {...props} />
      </ModuleGuard>
    );
  };
}

/**
 * Hook: useModuleGuard
 * Checks if a module is enabled and returns status
 */
export function useModuleGuard(moduleId: string) {
  const { activeModules, isLoading } = useSession();
  
  return {
    isAllowed: activeModules.includes(moduleId),
    isLoading,
  };
}
