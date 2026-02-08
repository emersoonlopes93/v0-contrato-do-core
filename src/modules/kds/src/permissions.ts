export const KDS_PERMISSIONS = {
  VIEW: 'kds.view',
  UPDATE_STATUS: 'kds.update-status',
} as const;

export type KdsPermission = (typeof KDS_PERMISSIONS)[keyof typeof KDS_PERMISSIONS];
