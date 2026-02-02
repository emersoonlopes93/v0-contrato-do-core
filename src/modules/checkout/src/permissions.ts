export const CHECKOUT_PERMISSIONS = {
  CHECKOUT_CREATE: 'checkout:create',
} as const;

export type CheckoutPermission =
  (typeof CHECKOUT_PERMISSIONS)[keyof typeof CHECKOUT_PERMISSIONS];

