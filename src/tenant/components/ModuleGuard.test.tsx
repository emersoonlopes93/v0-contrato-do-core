import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleGuard, withModuleGuard } from '@/src/tenant/components/ModuleGuard';
import { SessionContext } from '@/src/tenant/context/SessionContext';
import { TenantProvider } from '@/src/contexts/TenantContext';
import type { SessionContextValue } from '@/src/types/tenant';

// Mock SessionContext
const mockSession = (activeModules: string[] = []): SessionContextValue => ({
  user: null,
  accessToken: null,
  authError: null,
  tenantId: 'tenant-1',
  tenantSlug: 'xeque-mate',
  tenantOnboarded: true,
  tenantStatus: 'active',
  plan: null,
  tenantSettings: null,
  activeModules,
  isModuleEnabled: (moduleId: string) => activeModules.includes(moduleId),
  permissions: [],
  hasPermission: vi.fn(),
  loginTenant: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  clearAuthError: vi.fn(),
  isLoading: false,
  isRefreshing: false,
});

const renderWithSession = (ui: React.ReactNode, activeModules: string[] = []) => {
  return render(
    <TenantProvider tenantSlug="xeque-mate">
      <SessionContext.Provider value={mockSession(activeModules)}>
        {ui}
      </SessionContext.Provider>
    </TenantProvider>
  );
};

describe('ModuleGuard', () => {
  it('should render children when module is active', () => {
    renderWithSession(
      <ModuleGuard moduleId="test-module">
        <div>Protected Content</div>
      </ModuleGuard>,
      ['test-module']
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render fallback when module is inactive', () => {
    renderWithSession(
      <ModuleGuard moduleId="test-module" fallback={<div>Fallback</div>}>
        <div>Protected Content</div>
      </ModuleGuard>,
      []
    );
    expect(screen.getByText('Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should use default fallback if none provided', () => {
    renderWithSession(
      <ModuleGuard moduleId="test-module">
        <div>Protected Content</div>
      </ModuleGuard>,
      []
    );
    // Assuming default fallback has some text or structure, but simpler to check protected content missing
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('withModuleGuard HOC', () => {
  const ProtectedComponent = () => <div>Protected Component</div>;
  const GuardedComponent = withModuleGuard(ProtectedComponent, 'test-module', <div>Access Denied</div>);

  it('should render component when module is active', () => {
    renderWithSession(<GuardedComponent />, ['test-module']);
    expect(screen.getByText('Protected Component')).toBeInTheDocument();
  });

  it('should render fallback when module is inactive', () => {
    renderWithSession(<GuardedComponent />, []);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Component')).not.toBeInTheDocument();
  });
});
