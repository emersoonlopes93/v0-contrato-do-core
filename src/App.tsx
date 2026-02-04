import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TenantApp } from '@/src/tenant/TenantApp';
import { SaaSAdminApp } from '@/src/saas-admin/SaaSAdminApp';
import { AdminLoginPage } from '@/src/saas-admin/pages/Login';
import { GlobalTenantLoginPage } from '@/src/pages/Login';
import { PublicSignupPage } from '@/src/pages/Signup';
import MenuPublicPage from '@/src/pages/public/MenuPublic';

function LandingPage() {
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

function PublicRouter() {
  return (
    <Routes>
      <Route path="/login" element={<GlobalTenantLoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/signup" element={<PublicSignupPage />} />
      <Route path="/menu/:slug" element={<MenuPublicPage />} />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/tenant/*" element={<TenantApp />} />
        <Route path="/saas-admin/*" element={<SaaSAdminApp />} />
        <Route path="/admin/*" element={<SaaSAdminApp />} />
        <Route path="/*" element={<PublicRouter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
