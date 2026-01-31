export const ORDERS_PERMISSIONS = {
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
} as const;

export type OrdersPermission = (typeof ORDERS_PERMISSIONS)[keyof typeof ORDERS_PERMISSIONS];
