import { useState, useEffect, useCallback } from 'react';
import type { 
  CustomersCrmCustomerDetailsDTO,
  CustomersCrmCustomerListItemDTO,
  CustomersCrmUpdateCustomerRequest,
  CustomersCrmListCustomersResponseDTO 
} from '@/src/types/customers-crm';
import type { ModuleContext } from '@/src/core/modules/contracts';
import { CustomersCrmService } from '@/src/modules/customers-crm/src/services';

const service = new CustomersCrmService({} as ModuleContext);

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
      const result: CustomersCrmListCustomersResponseDTO = await service.listCustomers({
        tenantId,
        page,
        pageSize: pagination.pageSize,
        search: currentFilters.search,
        segment: currentFilters.segment,
      });
      
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
      const result = await service.getCustomerDetails({ tenantId, customerId: id });
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
      await service.updateCustomer({ tenantId, customerId: id, input: data });
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
