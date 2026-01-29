import React from "react"
import { TenantAuthProvider, useTenantAuth } from './hooks/use-tenant-auth';
import { TenantLayout } from './components/TenantLayout';
import { LoginPage } from './pages/Login';
import { HomePage } from './pages/Home';
import { HelloModulePage } from './pages/HelloModule';

/**
 * Tenant App - Entry Point
 * 
 * - Simple client-side routing
 * - Auth protection
 * - Module-aware routing
 * - Capacitor-ready (no Next.js router)
 */

function TenantRouter() {
  const { token, isLoading } = useTenantAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Not authenticated
  if (!token) {
    return <LoginPage />;
  }

  // Simple routing based on pathname
  const path = window.location.pathname;

  let page: React.ReactNode;

  if (path === '/tenant/hello') {
    page = <HelloModulePage />;
  } else if (path === '/tenant/profile') {
    page = (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Em construção</p>
      </div>
    );
  } else {
    page = <HomePage />;
  }

  return <TenantLayout>{page}</TenantLayout>;
}

export function TenantApp() {
  return (
    <TenantAuthProvider>
      <TenantRouter />
    </TenantAuthProvider>
  );
}
