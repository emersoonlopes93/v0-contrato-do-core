import { useState, useEffect, useCallback } from 'react';
import type {
  CustomersCrmCustomerDetailsDTO,
  CustomersCrmCustomerListItemDTO,
  CustomersCrmUpdateCustomerRequest,
  CustomersCrmListCustomersResponseDTO,
} from '@/src/types/customers-crm';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import { isRecord } from '@/src/core/utils/type-guards';

type State = {
  customers: CustomersCrmCustomerListItemDTO[];
  customer: CustomersCrmCustomerDetailsDTO | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    segment?: string;
  };
  updateCustomer: (id: string, data: CustomersCrmUpdateCustomerRequest) => Promise<void>;
  loadCustomers: (page?: number, filters?: State['filters']) => Promise<void>;
  loadCustomer: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

export function useCustomersCrm(tenantId: string): State {
  const [customers, setCustomers] = useState<CustomersCrmCustomerListItemDTO[]>([]);
  const [customer, setCustomer] = useState<CustomersCrmCustomerDetailsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<State['filters']>({});

  const loadCustomers = useCallback(async (page = 1, newFilters?: State['filters']) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentFilters = newFilters || filters;
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('pageSize', String(pagination.pageSize));
      if (currentFilters.search) searchParams.set('search', currentFilters.search);
      if (currentFilters.segment) searchParams.set('segment', currentFilters.segment);
      const result = await requestJson<CustomersCrmListCustomersResponseDTO>(
        `/api/v1/crm/customers?${searchParams.toString()}`,
      );
      
      setCustomers(result.items);
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      });
      
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [tenantId, pagination.pageSize, filters]);

  const loadCustomer = useCallback(async (id: string) => {
    if (!tenantId || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestJson<CustomersCrmCustomerDetailsDTO>(
        `/api/v1/crm/customers/${id}`,
      );
      setCustomer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const updateCustomer = useCallback(async (id: string, data: CustomersCrmUpdateCustomerRequest) => {
    if (!tenantId || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await requestJson<CustomersCrmCustomerDetailsDTO>(`/api/v1/crm/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await loadCustomers(pagination.page, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadCustomers, pagination.page, filters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    customer,
    loading,
    error,
    pagination,
    filters,
    updateCustomer,
    loadCustomers,
    loadCustomer,
    reload: () => loadCustomers(pagination.page, filters),
  };
}
