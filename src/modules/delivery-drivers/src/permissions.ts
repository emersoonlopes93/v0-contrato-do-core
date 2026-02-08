export const DELIVERY_DRIVERS_PERMISSIONS = {
  VIEW: 'delivery-drivers.view',
  MANAGE: 'delivery-drivers.manage',
  ASSIGN: 'delivery-drivers.assign',
} as const;

export type DeliveryDriversPermission =
  (typeof DELIVERY_DRIVERS_PERMISSIONS)[keyof typeof DELIVERY_DRIVERS_PERMISSIONS];
