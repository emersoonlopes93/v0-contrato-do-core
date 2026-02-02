export const SOUND_NOTIFICATIONS_PERMISSIONS = {
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
} as const;

export type SoundNotificationsPermission =
  (typeof SOUND_NOTIFICATIONS_PERMISSIONS)[keyof typeof SOUND_NOTIFICATIONS_PERMISSIONS];

