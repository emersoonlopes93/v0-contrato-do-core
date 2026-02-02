import { TenantApp } from './tenant/TenantApp';
import { SaaSAdminApp } from './saas-admin/SaaSAdminApp';
import { AdminLoginPage } from './saas-admin/pages/Login';
import { GlobalTenantLoginPage } from './pages/Login';
import { PublicSignupPage } from './pages/Signup';

function App() {
  // Simple routing
  const path = window.location.pathname;
  const isTenantApp = path.startsWith('/tenant');
  const isAdminApp = path.startsWith('/saas-admin') || path.startsWith('/admin');
  const isTenantLogin = path === '/login';
  const isPublicSignup = path === '/signup';
  const isAdminLogin = path === '/login/admin';

  if (isTenantApp) {
    return <TenantApp />;
  }

  if (isAdminApp) {
    return <SaaSAdminApp />;
  }

  if (isTenantLogin) {
    return <GlobalTenantLoginPage />;
  }

  if (isAdminLogin) {
    return <AdminLoginPage />;
  }

  if (isPublicSignup) {
    return <PublicSignupPage />;
  }

  // Default landing page
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold">SaaS Multi-Tenant Core</h1>
        <p className="mt-2 text-muted-foreground">Escolha uma aplicação:</p>
        <div className="mt-6 flex gap-4">
          <a
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Tenant App
          </a>
          <a
            href="/saas-admin"
            className="rounded-lg border px-6 py-3 hover:bg-accent"
          >
            SaaS Admin
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
