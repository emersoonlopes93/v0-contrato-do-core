import React, { useEffect } from "react"
import { SessionProvider, useSession } from '@/src/tenant/context/SessionContext';
import { TenantProvider, useTenant } from '@/src/contexts/TenantContext';
import { TenantLayout } from '@/src/tenant/components/TenantLayout';
import { HomePage } from '@/src/tenant/pages/Home';
import { HelloModulePage } from '@/src/tenant/pages/HelloModule';
import { OnboardPage } from '@/src/tenant/pages/Onboard';
import { MenuOnlinePage } from '@/src/tenant/pages/MenuOnline';
import { MenuOnlineCategoriesPage } from '@/src/tenant/pages/MenuOnlineCategories';
import { MenuOnlineProductsPage } from '@/src/tenant/pages/MenuOnlineProducts';
import { MenuOnlineModifiersPage } from '@/src/tenant/pages/MenuOnlineModifiers';
import { MenuOnlineSettingsPage } from '@/src/tenant/pages/MenuOnlineSettings';
import { MenuOnlinePreviewPage } from '@/src/tenant/pages/MenuOnlinePreview';
import { MenuOnlinePromotionsPage } from '@/src/tenant/pages/MenuOnlinePromotions';
import { MenuOnlineRewardsPage } from '@/src/tenant/pages/MenuOnlineRewards';
import { OrdersPage } from '@/src/tenant/pages/Orders';
import { OrdersKanbanPage } from '@/src/tenant/pages/OrdersKanban';
import { OrderDetailsPage } from '@/src/tenant/pages/OrderDetails';
import { SoundNotificationsSettingsPage } from '@/src/tenant/pages/SoundNotificationsSettings';
import { TenantSettingsPage } from '@/src/tenant/pages/TenantSettings';
import { CheckoutPage } from '@/src/tenant/pages/Checkout';
import { OrderSuccessPage } from '@/src/tenant/pages/OrderSuccess';
import { PaymentPage } from '@/src/tenant/pages/PaymentPage';
import { PaymentStatusPage } from '@/src/tenant/pages/PaymentStatus';
import { FinancialDashboardPage, FinancialOrdersPage } from '@/src/tenant/pages/Financial';
import { ThemeProvider } from '@/src/tenant/context/ThemeContext';
import { PlanProvider } from '@/src/tenant/context/PlanContext';
import { PlanGuard } from '@/src/tenant/components/PlanGuard';
import { TenantAuthGuard } from '@/src/tenant/guards/TenantAuthGuard';
import { TenantSlugGuard } from '@/src/tenant/guards/TenantSlugGuard';
import { NoModulesPage } from '@/src/tenant/pages/NoModules';
import { SoundNotificationsProvider } from '@/src/tenant/context/SoundNotificationsContext';
import { RealtimeProvider } from '@/src/realtime/realtime-context';

/**
 * Tenant App - Entry Point
 * 
 * - Simple client-side routing
 * - Auth protection via SessionContext
 * - Module-aware routing
 * - Capacitor-ready (no Next.js router)
 */

function getTenantSlugFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  if (segments[0] !== 'tenant') return null;
  const slug = segments[1]?.trim() ?? '';
  return slug.length > 0 ? slug : null;
}

function TenantRouter() {
  const { tenantSlug } = useTenant();
  const { isLoading, user, tenantOnboarded, activeModules } = useSession();
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const rest = segments.slice(2);
  const restPath = rest.length > 0 ? `/${rest.join('/')}` : '';

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

  if (restPath === '/login') {
    window.location.replace('/login');
    return null;
  }

  let page: React.ReactNode;

  if (restPath === '') {
    page = (
      <TenantAuthGuard>
        <TenantSlugGuard>
          <TenantLayout>
            <TenantHomeEntry
              tenantSlug={tenantSlug}
              tenantOnboarded={tenantOnboarded}
              activeModules={activeModules}
            />
          </TenantLayout>
        </TenantSlugGuard>
      </TenantAuthGuard>
    );
  } else if (restPath === '/onboard') {
    page = (
      <TenantAuthGuard>
        <TenantSlugGuard>
          <TenantLayout>
            <OnboardPage />
          </TenantLayout>
        </TenantSlugGuard>
      </TenantAuthGuard>
    );
  } else if (restPath === '/dashboard' || restPath === '/home') {
    page = <HomePage />;
  } else if (restPath === '/hello' || restPath === '/hello-module') {
    page = (
      <PlanGuard moduleId="hello-module">
        <HelloModulePage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlinePage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/categories') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineCategoriesPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/products') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineProductsPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/modifiers') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineModifiersPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/settings') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineSettingsPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/promotions') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlinePromotionsPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/rewards') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlineRewardsPage />
      </PlanGuard>
    );
  } else if (restPath === '/menu-online/preview') {
    page = (
      <PlanGuard moduleId="menu-online">
        <MenuOnlinePreviewPage />
      </PlanGuard>
    );
  } else if (restPath === '/financial') {
    page = (
      <PlanGuard moduleId="financial">
        <FinancialDashboardPage />
      </PlanGuard>
    );
  } else if (restPath === '/financial/orders') {
    page = (
      <PlanGuard moduleId="financial">
        <FinancialOrdersPage />
      </PlanGuard>
    );
  } else if (restPath === '/orders' || restPath === '/orders-module') {
    page = (
      <PlanGuard moduleId="orders-module">
        <OrdersPage />
      </PlanGuard>
    );
  } else if (restPath === '/orders/kanban') {
    page = (
      <PlanGuard moduleId="orders-module">
        <OrdersKanbanPage />
      </PlanGuard>
    );
  } else if (restPath === '/sound-notifications/settings') {
    page = (
      <PlanGuard moduleId="sound-notifications">
        <SoundNotificationsSettingsPage />
      </PlanGuard>
    );
  } else if (restPath === '/checkout') {
    page = (
      <PlanGuard moduleId="checkout">
        <CheckoutPage />
      </PlanGuard>
    );
  } else if (rest[0] === 'payments' && rest.length >= 2) {
    const orderId = rest[1]?.trim() ?? '';
    page = orderId ? (
      <PlanGuard moduleId="payments">
        <PaymentPage orderId={orderId} />
      </PlanGuard>
    ) : (
      <PlanGuard moduleId="payments">
        <div />
      </PlanGuard>
    );
  } else if (rest[0] === 'payment-status' && rest.length >= 2) {
    const paymentId = rest[1]?.trim() ?? '';
    page = paymentId ? (
      <PlanGuard moduleId="payments">
        <PaymentStatusPage paymentId={paymentId} />
      </PlanGuard>
    ) : (
      <PlanGuard moduleId="payments">
        <div />
      </PlanGuard>
    );
  } else if (rest[0] === 'order-success' && rest.length >= 2) {
    const orderId = rest[1]?.trim() ?? '';
    page = orderId ? (
      <PlanGuard moduleId="checkout">
        <OrderSuccessPage orderId={orderId} />
      </PlanGuard>
    ) : (
      <PlanGuard moduleId="checkout">
        <CheckoutPage />
      </PlanGuard>
    );
  } else if (restPath === '/settings') {
    page = <TenantSettingsPage />;
  } else if (rest[0] === 'orders' && rest.length >= 2) {
    const orderId = rest[1]?.trim() ?? '';
    page = orderId ? (
      <PlanGuard moduleId="orders-module">
        <OrderDetailsPage orderId={orderId} />
      </PlanGuard>
    ) : (
      <PlanGuard moduleId="orders-module">
        <OrdersPage />
      </PlanGuard>
    );
  } else if (restPath === '/profile') {
    page = (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Em construção</p>
      </div>
    );
  } else if (restPath === '/no-modules') {
    page = <NoModulesPage />;
  } else {
    page = <HomePage />;
  }

  // 5. Renderização Protegida
  if (restPath === '' || restPath === '/onboard') {
    return <RealtimeProvider>{page}</RealtimeProvider>;
  }

  return (
    <TenantAuthGuard>
      <TenantSlugGuard>
        <TenantLayout>
          <RealtimeProvider>{page}</RealtimeProvider>
        </TenantLayout>
      </TenantSlugGuard>
    </TenantAuthGuard>
  );
}

type TenantHomeEntryProps = {
  tenantSlug: string;
  tenantOnboarded: boolean;
  activeModules: string[];
};

function TenantHomeEntry({ tenantSlug, tenantOnboarded, activeModules }: TenantHomeEntryProps) {
  useEffect(() => {
    if (!tenantOnboarded) {
      const target = `/tenant/${tenantSlug}/onboard`;
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
      return;
    }

    if (activeModules.length === 1) {
      const onlyModule = activeModules[0];
      const target = `/tenant/${tenantSlug}/${onlyModule}`;
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
      return;
    }

    if (activeModules.length === 0) {
      const target = `/tenant/${tenantSlug}/no-modules`;
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
      return;
    }

    const target = `/tenant/${tenantSlug}/dashboard`;
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  }, [tenantSlug, tenantOnboarded, activeModules]);

  return null;
}

export function TenantApp() {
  const tenantSlug = getTenantSlugFromPath(window.location.pathname);
  if (!tenantSlug) {
    window.location.replace('/login');
    return null;
  }

  return (
    <TenantProvider tenantSlug={tenantSlug}>
      <SessionProvider>
        <PlanProvider>
          <ThemeProvider>
            <SoundNotificationsProvider>
              <TenantRouter />
            </SoundNotificationsProvider>
          </ThemeProvider>
        </PlanProvider>
      </SessionProvider>
    </TenantProvider>
  );
}
