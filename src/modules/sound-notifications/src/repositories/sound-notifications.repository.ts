import { getPrismaClient } from '@/src/adapters/prisma/client';
import {
  SOUND_NOTIFICATION_EVENTS,
  SOUND_NOTIFICATION_USER_ROLES,
  type SoundNotificationEventId,
  type SoundNotificationSettingsDTO,
  type SoundNotificationUpsertSettingInput,
  type SoundNotificationUpdateSettingRequest,
  type SoundNotificationUserRole,
} from '@/src/types/sound-notifications';

type SoundNotificationSettingsRow = {
  id: string;
  tenant_id: string;
  user_role: string;
  event: string;
  enabled: boolean;
  sound_key: string;
  volume: number;
  created_at: Date;
  updated_at: Date;
};

function isSoundNotificationEventId(value: string): value is SoundNotificationEventId {
  return Object.values(SOUND_NOTIFICATION_EVENTS).some((v) => v === value);
}

function isSoundNotificationUserRole(value: string): value is SoundNotificationUserRole {
  return Object.values(SOUND_NOTIFICATION_USER_ROLES).some((v) => v === value);
}

export class SoundNotificationsRepository {
  private readonly prisma = getPrismaClient();

  private toDTO(row: SoundNotificationSettingsRow): SoundNotificationSettingsDTO | null {
    if (!isSoundNotificationUserRole(row.user_role)) return null;
    if (!isSoundNotificationEventId(row.event)) return null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      userRole: row.user_role,
      event: row.event,
      enabled: row.enabled,
      soundKey: row.sound_key,
      volume: row.volume,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async listSettings(tenantId: string): Promise<SoundNotificationSettingsDTO[]> {
    const rows: SoundNotificationSettingsRow[] = await this.prisma.soundNotificationSettings.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ user_role: 'asc' }, { event: 'asc' }],
      select: {
        id: true,
        tenant_id: true,
        user_role: true,
        event: true,
        enabled: true,
        sound_key: true,
        volume: true,
        created_at: true,
        updated_at: true,
      },
    });

    return rows
      .map((row) => this.toDTO(row))
      .filter((row): row is SoundNotificationSettingsDTO => row !== null);
  }

  async upsertSettings(
    tenantId: string,
    settings: SoundNotificationUpsertSettingInput[],
  ): Promise<SoundNotificationSettingsDTO[]> {
    const updated = await Promise.all(
      settings.map(async (s) => {
        const row = await this.prisma.soundNotificationSettings.upsert({
          where: {
            tenant_id_user_role_event: {
              tenant_id: tenantId,
              user_role: s.userRole,
              event: s.event,
            },
          },
          update: {
            enabled: s.enabled,
            sound_key: s.soundKey,
            volume: s.volume,
          },
          create: {
            tenant_id: tenantId,
            user_role: s.userRole,
            event: s.event,
            enabled: s.enabled,
            sound_key: s.soundKey,
            volume: s.volume,
          },
          select: {
            id: true,
            tenant_id: true,
            user_role: true,
            event: true,
            enabled: true,
            sound_key: true,
            volume: true,
            created_at: true,
            updated_at: true,
          },
        });
        return this.toDTO(row);
      }),
    );

    return updated.filter((row): row is SoundNotificationSettingsDTO => row !== null);
  }

  async updateSetting(
    tenantId: string,
    id: string,
    input: SoundNotificationUpdateSettingRequest,
  ): Promise<SoundNotificationSettingsDTO | null> {
    const existing = await this.prisma.soundNotificationSettings.findFirst({
      where: { id, tenant_id: tenantId },
      select: { id: true },
    });
    if (!existing) return null;

    const data: { enabled?: boolean; sound_key?: string; volume?: number } = {};
    if (typeof input.enabled === 'boolean') data.enabled = input.enabled;
    if (typeof input.soundKey === 'string') data.sound_key = input.soundKey;
    if (typeof input.volume === 'number') data.volume = input.volume;

    const row = await this.prisma.soundNotificationSettings.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        tenant_id: true,
        user_role: true,
        event: true,
        enabled: true,
        sound_key: true,
        volume: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.toDTO(row);
  }
}
