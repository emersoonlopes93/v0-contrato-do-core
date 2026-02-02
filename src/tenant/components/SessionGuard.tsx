'use client';

import type { ReactNode } from 'react';
import { useSession } from '../context/SessionContext';
import { LoginPage } from '../pages/Login';

/**
 * Session Guard - Auth Protection
 * 
 * RESPONSIBILITIES:
 * - Ensure user is authenticated
 * - Show loading state while checking session
 * - Redirect to login (or show login) if not authenticated
 */

interface SessionGuardProps {
  children: ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { isLoading, user } = useSession();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
