import React, { useEffect } from 'react';
import { useSession } from '../context/SessionContext';

interface TenantAuthGuardProps {
  children: React.ReactNode;
}

export function TenantAuthGuard({ children }: TenantAuthGuardProps) {
  const { isAuthenticated, isLoading, tenantStatus } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Evitar loop se já estiver no login (embora o App deva controlar isso)
      if (window.location.pathname !== '/tenant/login') {
        window.location.replace('/tenant/login');
      }
    }
  }, [isLoading, isAuthenticated]);

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

  if (!isAuthenticated) {
    return null; // O useEffect cuidará do redirecionamento
  }

  const normalizedStatus = tenantStatus ? tenantStatus.toLowerCase() : null;

  if (normalizedStatus && normalizedStatus !== 'active') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Aguardando Ativação</h2>
          <p className="text-gray-600 mb-6">
            Seu ambiente foi criado, mas ainda aguarda a ativação final e configuração dos módulos pela equipe administrativa.
          </p>
          <div className="text-sm text-gray-500">
            Por favor, aguarde ou entre em contato com o suporte.
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Verificar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
