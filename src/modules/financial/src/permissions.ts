export const FINANCIAL_PERMISSIONS = {
  FINANCIAL_SUMMARY_READ: 'financial.summary.read',
  FINANCIAL_ORDERS_READ: 'financial.orders.read',
} as const;

export type FinancialPermission = (typeof FINANCIAL_PERMISSIONS)[keyof typeof FINANCIAL_PERMISSIONS];

