export type EmployeeStatus = 'active' | 'inactive';

export type EmployeeRole = 'admin' | 'gerente' | 'cozinha' | 'balconista' | 'garcom';

export function isEmployeeRole(role: string): role is EmployeeRole {
  return role === 'admin' || role === 'gerente' || role === 'cozinha' || role === 'balconista' || role === 'garcom';
}

export type EmployeeDTO = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: EmployeeRole;
  active: boolean;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeCreateRequest = {
  name: string;
  email: string;
  password: string;
  role: EmployeeRole;
};

export type EmployeeFormState = {
  name: string;
  email: string;
  password: string;
  role: '' | EmployeeRole;
};

export type EmployeeUpdateRequest = {
  name?: string;
  email?: string;
  role?: EmployeeRole;
  active?: boolean;
  status?: EmployeeStatus;
};

export type EmployeesServiceContract = {
  list(tenantId: string): Promise<EmployeeDTO[]>;
  findById(tenantId: string, id: string): Promise<EmployeeDTO | null>;
  create(tenantId: string, data: EmployeeCreateRequest): Promise<EmployeeDTO>;
  update(tenantId: string, id: string, data: EmployeeUpdateRequest): Promise<EmployeeDTO>;
  deactivate(tenantId: string, id: string): Promise<void>;
};
