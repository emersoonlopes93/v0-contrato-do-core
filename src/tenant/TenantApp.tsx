import React, { useEffect } from "react"
import { SessionProvider, useSession } from './context/SessionContext';
import { TenantLayout } from './components/TenantLayout';
import { LoginPage } from './pages/Login';
import { HomePage } from './pages/Home';
import { HelloModulePage } from './pages/HelloModule';
import { OnboardPage } from './pages/Onboard';
import { MenuOnlinePage } from './pages/MenuOnline';
import { MenuOnlineCategoriesPage } from './pages/MenuOnlineCategories';
import { MenuOnlineProductsPage } from './pages/MenuOnlineProducts';
import { MenuOnlineModifiersPage } from './pages/MenuOnlineModifiers';
import { MenuOnlineSettingsPage } from './pages/MenuOnlineSettings';
import { MenuOnlinePreviewPage } from './pages/MenuOnlinePreview';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import { PlanGuard } from './components/PlanGuard';
import { TenantAuthGuard } from './guards/TenantAuthGuard';
import { NoModulesPage } from './pages/NoModules';

/**
 * Tenant App - Entry Point
 * 
 * - Simple client-side routing
 * - Auth protection via SessionContext
 * - Module-aware routing
 * - Capacitor-ready (no Next.js router)
 */
function TenantRouter() {
  const { isAuthenticated, isLoading, user, tenantOnboarded, activeModules } = useSession();
  const path = window.location.pathname;

  // 1. Loading inicial global (opcional, mas evita flashes)
  // O TenantAuthGuard também tem loading, mas aqui pegamos antes de decidir a rota
  if (isLoading) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Inicializando app...</p>
        </div>
      </div>
    );
  }

  // 2. Redirecionamento de SaaS Admin
  if (user?.role === 'SAAS_ADMIN') {
    window.location.href = '/saas-admin';
    return null;
  }

  if (path === '/tenant/login') {
    if (isAuthenticated) {
      window.location.replace('/tenant');
      return null;
    }
    return <LoginPage />;
  }

  let page: React.ReactNode;

  if (path === '/tenant') {
    page = (
      <TenantAuthGuard>
        <TenantLayout>
          <TenantHomeEntry
            tenantOnboarded={tenantOnboarded}
            activeModules={activeModules}
          />
        </TenantLayout>
      </TenantAuthGuard>
    );
  } else if (path === '/tenant/onboard') {
    page = (
      <TenantAuthGuard>
        <TenantLayout>
          <OnboardPage />
        </TenantLayout>
      </TenantAuthGuard>
    );
  } else if (path === '/tenant/hello' || path === '/tenant/hello-module') {
    page = (
      <PlanGuard moduleId="hello-module">
        <HelloModulePage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlinePage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online/categories') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineCategoriesPage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online/products') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineProductsPage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online/modifiers') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineModifiersPage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online/settings') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineSettingsPage />
      </PlanGuard>
    );
  } else if (path === '/tenant/menu-online/preview') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlinePreviewPage />
      </PlanGuard>
    );
  } else if (path === '/tenant/profile') {
    page = (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Em construção</p>
      </div>
    );
  } else if (path === '/tenant/no-modules') {
    page = <NoModulesPage />;
  } else {
    page = <HomePage />;
  }

  // 5. Renderização Protegida
  if (path === '/tenant' || path === '/tenant/onboard') {
    return page;
  }

  return (
    <TenantAuthGuard>
      <TenantLayout>{page}</TenantLayout>
    </TenantAuthGuard>
  );
}

interface TenantHomeEntryProps {
  tenantOnboarded: boolean;
  activeModules: string[];
}

function TenantHomeEntry({ tenantOnboarded, activeModules }: TenantHomeEntryProps) {
  useEffect(() => {
    if (!tenantOnboarded) {
      if (window.location.pathname !== '/tenant/onboard') {
        window.location.replace('/tenant/onboard');
      }
      return;
    }

    if (activeModules.length === 1) {
      const onlyModule = activeModules[0];
      const target = `/tenant/${onlyModule}`;
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
      return;
    }

    if (activeModules.length === 0) {
      if (window.location.pathname !== '/tenant/no-modules') {
        window.location.replace('/tenant/no-modules');
      }
      return;
    }

    if (window.location.pathname !== '/tenant/home') {
      window.location.replace('/tenant/home');
    }
  }, [tenantOnboarded, activeModules]);

  return null;
}

export function TenantApp() {
  return (
    <SessionProvider>
      <PlanProvider>
        <ThemeProvider>
          <TenantRouter />
        </ThemeProvider>
      </PlanProvider>
    </SessionProvider>
  );
}
