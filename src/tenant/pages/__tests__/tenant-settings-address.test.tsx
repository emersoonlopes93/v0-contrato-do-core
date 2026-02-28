import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TenantSettingsPage } from '@/src/tenant/pages/TenantSettings';

vi.mock('@/src/contexts/TenantContext', () => ({
  useTenant: () => ({ tenantSlug: 'demo' }),
}));
vi.mock('@/src/tenant/context/SessionContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/tenant/context/SessionContext')>();
  return {
    ...actual,
    useSession: () => ({
      tenantSettings: { city: 'São Paulo', state: 'SP', timezone: 'America/Sao_Paulo', isOpen: true, kdsEnabled: true, pdvEnabled: true, realtimeEnabled: true, printingEnabled: false },
      refreshSession: async () => undefined,
      activeModules: ['settings'],
    }),
  };
});

describe('TenantSettings address duplication', () => {
  it('does not render address inputs', () => {
    render(<TenantSettingsPage />);
    expect(screen.queryByLabelText('Rua')).toBeNull();
    expect(screen.queryByLabelText('CEP')).toBeNull();
  });
});
