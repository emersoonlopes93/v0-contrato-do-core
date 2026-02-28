import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MenuOnlineProductsPage } from '@/src/tenant/pages/MenuOnlineProducts';

vi.mock('@/src/contexts/TenantContext', () => ({
  useTenant: () => ({ tenantSlug: 'demo' }),
}));
vi.mock('@/src/tenant/context/SessionContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/tenant/context/SessionContext')>();
  return {
    ...actual,
    useSession: () => ({ isModuleEnabled: () => true, activeModules: ['menu-online'], hasPermission: () => true, tenantId: 't1' }),
  };
});

describe('MenuOnlineProducts modal behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string): Promise<{ ok: boolean; json: () => Promise<unknown>; text?: () => Promise<string> }> => {
      if (url.includes('/categories')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: [{ id: 'c1', name: 'Lanches', sortOrder: 0, status: 'active', description: null }] }),
          text: async () => JSON.stringify({ success: true, data: [{ id: 'c1', name: 'Lanches', sortOrder: 0, status: 'active', description: null }] }),
        };
      }
      if (url.includes('/products')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: [] }),
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { id: 'p1', name: 'Produto', categoryId: 'c1', basePrice: 10, description: null, sortOrder: 0, status: 'active', images: [], priceVariations: [], modifierGroupIds: [] } }),
      };
    }));
  });

  it('closes modal after creating product with success feedback', async () => {
    render(<MenuOnlineProductsPage />);
    const newButton = await screen.findByText('Novo Produto');
    fireEvent.click(newButton);
    const nameInput = await screen.findByLabelText('Nome');
    fireEvent.change(nameInput, { target: { value: 'X-Burger' } });
    const submit = await screen.findByText('Criar');
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.queryByText('Criar')).toBeNull();
    }, { timeout: 1500 });
  });
});
