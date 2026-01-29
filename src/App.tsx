import { TenantApp } from './tenant/TenantApp';

function App() {
  // Simple routing - check if path starts with /tenant
  const isTenantApp = window.location.pathname.startsWith('/tenant');

  if (isTenantApp) {
    return <TenantApp />;
  }

  // Default landing page
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-3xl font-bold">SaaS Multi-Tenant Core</h1>
        <p className="mt-2 text-muted-foreground">Escolha uma aplicação:</p>
        <div className="mt-6 flex gap-4">
          <a
            href="/tenant"
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
