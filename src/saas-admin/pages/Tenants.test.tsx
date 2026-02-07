import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminTenantsPage } from './Tenants';
import { adminApi } from '../lib/adminApi';

// Mock adminApi
vi.mock('../lib/adminApi', () => ({
  adminApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedAdminApi = vi.mocked(adminApi);

describe('AdminTenantsPage', () => {
  const mockPlans = [
    { id: 'plan-1', name: 'Basic' },
    { id: 'plan-2', name: 'Pro' },
  ];

  const mockTenants = [
    { id: 'tenant-1', name: 'Acme', slug: 'acme', status: 'active' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAdminApi.get.mockImplementation((url: string) => {
      if (url === '/plans') return Promise.resolve(mockPlans);
      if (url === '/tenants') return Promise.resolve(mockTenants);
      return Promise.resolve([]);
    });
  });

  it('renders tenants and plans', async () => {
    render(<AdminTenantsPage />);

    // Check tenants list
    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument();
    });

    // Check plans select
    const [select] = screen.getAllByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('submits form with planId', async () => {
    mockedAdminApi.post.mockResolvedValue({});
    
    render(<AdminTenantsPage />);

    // Wait for data load
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Ex: Minha Empresa'), {
      target: { value: 'New Tenant' },
    });
    fireEvent.change(screen.getByPlaceholderText('minha-empresa'), {
      target: { value: 'new-tenant' },
    });
    
    // Select plan (should default to first, but let's change it)
    const [planSelect] = screen.getAllByRole('combobox');
    fireEvent.change(planSelect, {
      target: { value: 'plan-2' },
    });

    // Submit
    fireEvent.click(screen.getByText('Criar Tenant'));

    await waitFor(() => {
      expect(mockedAdminApi.post).toHaveBeenCalledWith('/tenants', {
        name: 'New Tenant',
        slug: 'new-tenant',
        planId: 'plan-2',
      });
    });
  });
});
