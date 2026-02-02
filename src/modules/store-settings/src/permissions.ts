export const STORE_SETTINGS_PERMISSIONS = {
  READ: 'store-settings.read',
  WRITE: 'store-settings.write',
} as const;

export type StoreSettingsPermission =
  (typeof STORE_SETTINGS_PERMISSIONS)[keyof typeof STORE_SETTINGS_PERMISSIONS];

