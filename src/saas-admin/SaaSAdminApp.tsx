import React from 'react';
import { AdminSessionGuard } from './components/AdminSessionGuard';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardPage } from './pages/Dashboard';
import { AdminTenantsPage } from './pages/Tenants';
import { AdminTenantSignupPage } from './pages/TenantSignup';
import { AdminPlansPage } from './pages/Plans';
import { AdminModulesPage } from './pages/Modules';
import { AdminWhiteLabelPage } from './pages/WhiteLabel';
import { AdminAuditLogsPage } from './pages/AuditLogs';
import './styles/saas-admin.css';

export function SaaSAdminApp() {
  const path = window.location.pathname;

  let page: React.ReactNode;
  if (path === '/admin' || path === '/saas-admin') {
    page = <AdminDashboardPage />;
  } else if (path === '/admin/tenants/create') {
    page = <AdminTenantSignupPage />;
  } else if (path.startsWith('/admin/tenants')) {
    page = <AdminTenantsPage />;
  } else if (path.startsWith('/admin/plans')) {
    page = <AdminPlansPage />;
  } else if (path.startsWith('/admin/modules')) {
    page = <AdminModulesPage />;
  } else if (path.startsWith('/admin/white-label')) {
    page = <AdminWhiteLabelPage />;
  } else if (path.startsWith('/admin/audit')) {
    page = <AdminAuditLogsPage />;
  } else {
    page = <AdminDashboardPage />;
  }

  return (
    <AdminSessionGuard>
      <AdminLayout>{page}</AdminLayout>
    </AdminSessionGuard>
  );
}
