import React from 'react';
import { AdminSessionGuard } from '@/src/saas-admin/components/AdminSessionGuard';
import { AdminLayout } from '@/src/saas-admin/components/AdminLayout';
import { AdminDashboardPage } from '@/src/saas-admin/pages/Dashboard';
import { AdminTenantsPage } from '@/src/saas-admin/pages/Tenants';
import { AdminTenantSignupPage } from '@/src/saas-admin/pages/TenantSignup';
import { AdminPlansPage } from '@/src/saas-admin/pages/Plans';
import { AdminModulesPage } from '@/src/saas-admin/pages/Modules';
import { AdminWhiteLabelPage } from '@/src/saas-admin/pages/WhiteLabel';
import { AdminAuditLogsPage } from '@/src/saas-admin/pages/AuditLogs';
import { AdminGlobalSettingsPage } from '@/src/saas-admin/pages/Settings';
import { AdminOrdersPage } from '@/src/saas-admin/pages/Orders';
import { AdminMenuPage } from '@/src/saas-admin/pages/Menu';
import { AdminCustomersPage } from '@/src/saas-admin/pages/Customers';
import { AdminStoreDesignerPage } from '@/src/saas-admin/pages/StoreDesigner';
import { AdminIntegrationsPage } from '@/src/saas-admin/pages/Integrations';
import { AdminFinancePage } from '@/src/saas-admin/pages/Finance';
import '@/src/saas-admin/styles/saas-admin.css';

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
  } else if (path.startsWith('/admin/orders')) {
    page = <AdminOrdersPage />;
  } else if (path.startsWith('/admin/menu')) {
    page = <AdminMenuPage />;
  } else if (path.startsWith('/admin/customers')) {
    page = <AdminCustomersPage />;
  } else if (path.startsWith('/admin/store-designer')) {
    page = <AdminStoreDesignerPage />;
  } else if (path.startsWith('/admin/integrations')) {
    page = <AdminIntegrationsPage />;
  } else if (path.startsWith('/admin/finance')) {
    page = <AdminFinancePage />;
  } else if (path.startsWith('/admin/white-label')) {
    page = <AdminWhiteLabelPage />;
  } else if (path.startsWith('/admin/settings')) {
    page = <AdminGlobalSettingsPage />;
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
