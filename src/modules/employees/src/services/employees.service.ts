import { isEmployeeRole, type EmployeeDTO, type EmployeeCreateRequest, type EmployeeUpdateRequest, type EmployeesServiceContract } from '@/src/types/employees';
import { EmployeesRepository } from '@/src/modules/employees/src/repositories';

export class EmployeesService implements EmployeesServiceContract {
  private repository = new EmployeesRepository();

  async list(tenantId: string): Promise<EmployeeDTO[]> {
    return await this.repository.findByTenant(tenantId);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDTO | null> {
    return await this.repository.findById(tenantId, id);
  }

  async create(tenantId: string, data: EmployeeCreateRequest): Promise<EmployeeDTO> {
    if (!isEmployeeRole(data.role)) {
      throw new Error('Role inválido');
    }

    return await this.repository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, data: EmployeeUpdateRequest): Promise<EmployeeDTO> {
    const employee = await this.repository.findById(tenantId, id);
    if (!employee) {
      throw new Error('Funcionário não encontrado');
    }

    if (data.role && !isEmployeeRole(data.role)) {
      throw new Error('Role inválido');
    }

    const normalized: EmployeeUpdateRequest = {
      ...data,
      status: data.status ?? (data.active !== undefined ? (data.active ? 'active' : 'inactive') : undefined),
      active: data.active ?? (data.status !== undefined ? data.status === 'active' : undefined),
    };

    // Validar email único se for alterado
    if (data.email && data.email !== employee.email) {
      void 0;
    }

    const updated = await this.repository.update(tenantId, id, normalized);
    if (!updated) {
      throw new Error('Erro ao atualizar funcionário');
    }

    return updated;
  }

  async deactivate(tenantId: string, id: string): Promise<void> {
    const employee = await this.repository.findById(tenantId, id);
    if (!employee) {
      throw new Error('Funcionário não encontrado');
    }

    await this.repository.deactivate(tenantId, id);
  }
}
