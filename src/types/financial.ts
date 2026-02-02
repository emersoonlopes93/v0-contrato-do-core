export type FinancialSummaryDTO = {
  id: string;
  tenantId: string;
  totalOrders: number;
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  totalRefunded: number;
  totalFees: number;
  netAmount: number;
  updatedAt: string;
};

export type FinancialOrderDTO = {
  orderId: string;
  orderNumber: number;
  total: number;
  paymentId: string;
  paymentMethod: string;
  paymentProvider: string;
  paidAt: string;
  createdAt: string;
};

export type FinancialOrdersListDTO = {
  items: FinancialOrderDTO[];
  page: number;
  pageSize: number;
  total: number;
};

export type FinancialServiceContract = {
  getSummary(tenantId: string): Promise<FinancialSummaryDTO>;
  listPaidOrders(args: { tenantId: string; page: number; pageSize: number }): Promise<FinancialOrdersListDTO>;
};

