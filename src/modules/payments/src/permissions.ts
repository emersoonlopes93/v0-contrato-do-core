export const PAYMENTS_PERMISSIONS = {
  PAYMENTS_CREATE: 'payments:create',
} as const;

export type PaymentsPermission =
  (typeof PAYMENTS_PERMISSIONS)[keyof typeof PAYMENTS_PERMISSIONS];

