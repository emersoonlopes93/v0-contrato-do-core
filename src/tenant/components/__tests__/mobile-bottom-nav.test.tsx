import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileBottomNav } from '@/src/tenant/components/MobileBottomNav';

vi.mock('@/src/contexts/TenantContext', () => ({
  useTenant: () => ({ tenantSlug: 'demo' }),
}));
vi.mock('@/src/tenant/context/SessionContext', () => ({
  useSession: () => ({
    isModuleEnabled: () => true,
    hasPermission: () => false,
  }),
}));
vi.mock('@/src/modules/registry', () => ({
  listTenantUiModules: async () => [
    {
      id: 'designer-menu',
      name: 'Designer do Cardápio',
      description: 'Personalização visual',
      version: '1.0.0',
      requiredPlan: 'basic',
      permissions: [],
      eventTypes: [],
      uiEntry: { tenantBasePath: '/designer-menu', homeLabel: 'Designer do Cardápio', icon: 'palette', category: 'Cardápio' },
      type: 'visual',
      scope: 'public-menu',
      mobileFirst: true,
      requiresAuth: true,
      canDisable: true,
    },
  ],
}));

describe('MobileBottomNav', () => {
  it('shows Designer do Cardápio when module has no permissions and is enabled', async () => {
    render(<MobileBottomNav />);
    const link = await screen.findByText('Designer do Cardápio');
    expect(link).toBeDefined();
  });
});
