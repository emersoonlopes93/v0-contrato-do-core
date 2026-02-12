export type CustomersCrmCustomerStatus = 'normal' | 'vip' | 'bloqueado' | 'inativo';

export type CustomersCrmCustomerDTO = {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: CustomersCrmCustomerStatus;
  createdAt: string;
  updatedAt: string;

  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderAt: string | null;
  frequencyScore: number;
  recentOrders?: CustomersCrmCustomerOrderSummaryDTO[];
};

export type CustomersCrmCustomerListItemDTO = {
  id: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderAt: string | null;
  badge: 'vip' | 'recorrente' | 'novo' | 'normal';
  status: CustomersCrmCustomerStatus;
};

export type CustomersCrmListCustomersResponseDTO = {
  items: CustomersCrmCustomerListItemDTO[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CustomersCrmCustomerOrderSummaryDTO = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
};

export type CustomersCrmCustomerDetailsDTO = {
  customer: CustomersCrmCustomerDTO;
  recentOrders: CustomersCrmCustomerOrderSummaryDTO[];
  spendingSeries: Array<{ date: string; total: number }>;
};

export type CustomersCrmUpdateCustomerRequest = {
  notes?: string | null;
  status?: CustomersCrmCustomerStatus;
  name?: string;
  phone?: string | null;
  email?: string | null;
};

export type CustomersCrmOverviewMetricsDTO = {
  customers: number;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
};

export type CustomersCrmServiceContract = {
  listCustomers(request: {
    tenantId: string;
    page: number;
    pageSize: number;
    segment?: string | null;
    search?: string | null;
  }): Promise<CustomersCrmListCustomersResponseDTO>;

  getCustomerDetails(request: {
    tenantId: string;
    customerId: string;
  }): Promise<CustomersCrmCustomerDetailsDTO | null>;

  updateCustomer(request: {
    tenantId: string;
    customerId: string;
    input: CustomersCrmUpdateCustomerRequest;
  }): Promise<CustomersCrmCustomerDTO>;

  getOverviewMetrics(request: {
    tenantId: string;
  }): Promise<CustomersCrmOverviewMetricsDTO>;
};
