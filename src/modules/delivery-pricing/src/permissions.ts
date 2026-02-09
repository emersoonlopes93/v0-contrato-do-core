export const DELIVERY_PRICING_PERMISSIONS = {
  READ: 'delivery-pricing.read',
  WRITE: 'delivery-pricing.write',
} as const;

export type DeliveryPricingPermission =
  (typeof DELIVERY_PRICING_PERMISSIONS)[keyof typeof DELIVERY_PRICING_PERMISSIONS];
