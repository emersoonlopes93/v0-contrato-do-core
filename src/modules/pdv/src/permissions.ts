export const PDV_PERMISSIONS = {
  VIEW: 'pdv.view',
  CREATE_ORDER: 'pdv.create-order',
} as const;

export type PdvPermission = (typeof PDV_PERMISSIONS)[keyof typeof PDV_PERMISSIONS];
