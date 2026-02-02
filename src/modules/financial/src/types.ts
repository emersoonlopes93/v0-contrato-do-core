export type TenantFinancialSummaryRow = {
  id: string;
  tenant_id: string;
  total_orders: number;
  total_paid: number;
  total_pending: number;
  total_cancelled: number;
  total_refunded: number;
  total_fees: number;
  net_amount: number;
  updated_at: Date;
};

export type FinancialPaidOrderRow = {
  payment: {
    id: string;
    amount: number;
    method: string;
    provider: string;
    updated_at: Date;
  };
  order: {
    id: string;
    order_number: number;
    total: number;
    created_at: Date;
  };
};

