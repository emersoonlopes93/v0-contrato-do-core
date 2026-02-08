export const CASHIER_PERMISSIONS = {
  VIEW: 'cashier.view',
  OPEN: 'cashier.open',
  CLOSE: 'cashier.close',
} as const;

export type CashierPermission = (typeof CASHIER_PERMISSIONS)[keyof typeof CASHIER_PERMISSIONS];
