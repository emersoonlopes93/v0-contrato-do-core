import React from 'react';
import { useSession } from '../context/SessionContext';

type TenantAuthGuardProps = {
  children: React.ReactNode;
};

export function TenantAuthGuard({ children }: TenantAuthGuardProps) {
  const { isLoading, user } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
    return null;
  }

  return <>{children}</>;
}
