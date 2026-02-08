export const DELIVERY_ROUTES_PERMISSIONS = {
  VIEW: 'delivery-routes.view',
  MANAGE: 'delivery-routes.manage',
  ASSIGN: 'delivery-routes.assign',
} as const;

export type DeliveryRoutesPermission =
  (typeof DELIVERY_ROUTES_PERMISSIONS)[keyof typeof DELIVERY_ROUTES_PERMISSIONS];
