export const SOUND_NOTIFICATION_EVENTS = {
  ORDER_CREATED: 'orders.created',
  ORDER_STATUS_CHANGED: 'orders.status.changed',
  PAYMENT_CONFIRMED: 'payments.confirmed',
} as const;

export type SoundNotificationEventId =
  (typeof SOUND_NOTIFICATION_EVENTS)[keyof typeof SOUND_NOTIFICATION_EVENTS];

export const SOUND_NOTIFICATION_USER_ROLES = {
  ADMIN: 'admin',
  ATENDENTE: 'atendente',
  COZINHA: 'cozinha',
  CAIXA: 'caixa',
} as const;

export type SoundNotificationUserRole =
  (typeof SOUND_NOTIFICATION_USER_ROLES)[keyof typeof SOUND_NOTIFICATION_USER_ROLES];

export interface SoundNotificationSettingsDTO {
  id: string;
  tenantId: string;
  userRole: SoundNotificationUserRole;
  event: SoundNotificationEventId;
  enabled: boolean;
  soundKey: string;
  volume: number;
  createdAt: string;
  updatedAt: string;
}

export interface SoundNotificationUpsertSettingInput {
  userRole: SoundNotificationUserRole;
  event: SoundNotificationEventId;
  enabled: boolean;
  soundKey: string;
  volume: number;
}

export interface SoundNotificationUpsertSettingsRequest {
  settings: SoundNotificationUpsertSettingInput[];
}

export interface SoundNotificationUpdateSettingRequest {
  enabled?: boolean;
  soundKey?: string;
  volume?: number;
}

export interface SoundNotificationEventDTO {
  id: string;
  event: SoundNotificationEventId;
  tenantId: string;
  orderId: string | null;
  orderNumber: number | null;
  timestamp: string;
}

export interface SoundNotificationsServiceContract {
  listSettings(tenantId: string): Promise<SoundNotificationSettingsDTO[]>;
  upsertSettings(
    tenantId: string,
    input: SoundNotificationUpsertSettingsRequest,
  ): Promise<SoundNotificationSettingsDTO[]>;
  updateSetting(
    tenantId: string,
    id: string,
    input: SoundNotificationUpdateSettingRequest,
  ): Promise<SoundNotificationSettingsDTO | null>;
  pollEvents(
    tenantId: string,
    since: number | null,
    limit?: number,
  ): Promise<SoundNotificationEventDTO[]>;
}
