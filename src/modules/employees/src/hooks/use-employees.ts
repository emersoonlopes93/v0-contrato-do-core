import { useState, useEffect, useCallback } from 'react';
import type { EmployeeDTO, EmployeeCreateRequest, EmployeeUpdateRequest } from '@/src/types/employees';
import { EmployeesService } from '@/src/modules/employees/src/services';

const service = new EmployeesService();

type State = {
  employees: EmployeeDTO[];
  employee: EmployeeDTO | null;
  loading: boolean;
  error: string | null;
  createEmployee: (data: EmployeeCreateRequest) => Promise<void>;
  updateEmployee: (id: string, data: EmployeeUpdateRequest) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

export function useEmployees(tenantId: string): State {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.list(tenantId);
      setEmployees(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createEmployee = useCallback(async (data: EmployeeCreateRequest) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await service.create(tenantId, data);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar funcionário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadEmployees]);

  const updateEmployee = useCallback(async (id: string, data: EmployeeUpdateRequest) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await service.update(tenantId, id, data);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar funcionário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadEmployees]);

  const deactivateEmployee = useCallback(async (id: string) => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await service.deactivate(tenantId, id);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desativar funcionário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadEmployees]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    employees,
    employee: null,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reload: loadEmployees,
  };
}

export function useEmployee(tenantId: string, id: string) {
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployee = useCallback(async () => {
    if (!tenantId || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.findById(tenantId, id);
      setEmployee(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionário');
    } finally {
      setLoading(false);
    }
  }, [tenantId, id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  return {
    employee,
    loading,
    error,
    reload: loadEmployee,
  };
}
