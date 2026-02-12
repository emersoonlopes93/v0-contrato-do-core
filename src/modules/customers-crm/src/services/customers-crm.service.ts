import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  CustomersCrmCustomerDetailsDTO,
  CustomersCrmCustomerDTO,
  CustomersCrmListCustomersResponseDTO,
  CustomersCrmOverviewMetricsDTO,
  CustomersCrmServiceContract,
  CustomersCrmUpdateCustomerRequest,
} from '@/src/types/customers-crm';
import { CustomersCrmRepository } from '../repositories/customers-crm.repository';

export class CustomersCrmService implements CustomersCrmServiceContract {
  private readonly repo = new CustomersCrmRepository();

  constructor(private readonly context: ModuleContext) {
    void context;
  }

  async listCustomers(request: {
    tenantId: string;
    page: number;
    pageSize: number;
    segment?: string | null;
    search?: string | null;
  }): Promise<CustomersCrmListCustomersResponseDTO> {
    return this.repo.listCustomers(request);
  }

  async getCustomerDetails(request: {
    tenantId: string;
    customerId: string;
  }): Promise<CustomersCrmCustomerDetailsDTO | null> {
    return this.repo.getCustomerDetails(request);
  }

  async updateCustomer(request: {
    tenantId: string;
    customerId: string;
    input: CustomersCrmUpdateCustomerRequest;
  }): Promise<CustomersCrmCustomerDTO> {
    return this.repo.updateCustomer(request);
  }

  async getOverviewMetrics(request: { tenantId: string }): Promise<CustomersCrmOverviewMetricsDTO> {
    return this.repo.getOverviewMetrics(request);
  }
}
