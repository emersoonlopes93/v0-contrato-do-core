import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PdvPage } from '@/src/modules/pdv/src/pages/PdvPage';

vi.mock('@/src/contexts/TenantContext', () => ({
  useTenant: () => ({ tenantSlug: 'demo' }),
}));
vi.mock('@/src/tenant/context/SessionContext', () => ({
  useSession: () => ({
    tenantSettings: { pdvEnabled: true, realtimeEnabled: false },
    hasPermission: () => true,
    activeModules: ['pdv'],
  }),
}));
vi.mock('@/src/realtime/useRealtime', () => ({
  useRealtimeEvent: () => ({ subscribe: () => () => {} }),
}));
vi.mock('@/src/modules/pdv/src/services/pdvService', () => ({
  fetchPdvProducts: async () => [{ id: 'p1', name: 'Coxinha', basePrice: 5, sortOrder: 0, status: 'active', categoryId: 'c1', images: [], priceVariations: [], modifierGroupIds: [] }],
  fetchPdvCategories: async () => [{ id: 'c1', name: 'Salgados', sortOrder: 0, status: 'active', description: null }],
  fetchPdvSettings: async () => ({ currency: 'BRL', showImages: true }),
  fetchPdvOrders: async () => [],
  submitPdvOrder: async () => null,
}));

describe('PDV page', () => {
  it('renders products from cardápio', async () => {
    render(<PdvPage />);
    const product = await screen.findByText('Coxinha');
    expect(product).toBeDefined();
  });
});
