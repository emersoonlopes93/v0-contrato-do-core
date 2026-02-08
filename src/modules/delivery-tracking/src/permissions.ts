export const DELIVERY_TRACKING_PERMISSIONS = {
  VIEW: 'delivery-tracking.view',
} as const;

export type DeliveryTrackingPermission =
  (typeof DELIVERY_TRACKING_PERMISSIONS)[keyof typeof DELIVERY_TRACKING_PERMISSIONS];
