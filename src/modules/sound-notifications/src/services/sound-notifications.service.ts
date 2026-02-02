import type { ModuleContext } from '@/src/core/modules/contracts';
import {
  SOUND_NOTIFICATION_EVENTS,
  type SoundNotificationEventDTO,
  type SoundNotificationEventId,
  type SoundNotificationSettingsDTO,
  type SoundNotificationUpsertSettingsRequest,
  type SoundNotificationUpdateSettingRequest,
  type SoundNotificationsServiceContract,
} from '@/src/types/sound-notifications';
import { SoundNotificationsRepository } from '../repositories/sound-notifications.repository';

type SoundNotificationEventInternal = {
  id: string;
  event: SoundNotificationEventId;
  tenantId: string;
  orderId: string | null;
  orderNumber: number | null;
  timestampMs: number;
};

export class SoundNotificationsService implements SoundNotificationsServiceContract {
  private readonly repository: SoundNotificationsRepository;
  private readonly eventsByTenant: Map<string, SoundNotificationEventInternal[]> = new Map();

  constructor(context: ModuleContext) {
    this.repository = new SoundNotificationsRepository();
    void context;
  }

  async listSettings(tenantId: string): Promise<SoundNotificationSettingsDTO[]> {
    return this.repository.listSettings(tenantId);
  }

  async upsertSettings(
    tenantId: string,
    input: SoundNotificationUpsertSettingsRequest,
  ): Promise<SoundNotificationSettingsDTO[]> {
    return this.repository.upsertSettings(tenantId, input.settings);
  }

  async updateSetting(
    tenantId: string,
    id: string,
    input: SoundNotificationUpdateSettingRequest,
  ): Promise<SoundNotificationSettingsDTO | null> {
    return this.repository.updateSetting(tenantId, id, input);
  }

  async pollEvents(tenantId: string, since: number | null, limit = 50): Promise<SoundNotificationEventDTO[]> {
    const events = this.eventsByTenant.get(tenantId) ?? [];
    const filtered = events.filter((e) => (since === null ? true : e.timestampMs > since));
    const sliced = filtered.slice(0, Math.max(0, limit));

    return sliced.map((e) => ({
      id: e.id,
      event: e.event,
      tenantId: e.tenantId,
      orderId: e.orderId,
      orderNumber: e.orderNumber,
      timestamp: new Date(e.timestampMs).toISOString(),
    }));
  }

  recordOrderCreated(input: {
    tenantId: string;
    orderId: string | null;
    orderNumber: number | null;
    timestampMs: number;
  }): void {
    const tenantEvents = this.eventsByTenant.get(input.tenantId) ?? [];
    const event: SoundNotificationEventInternal = {
      id: `sound-notifications:${SOUND_NOTIFICATION_EVENTS.ORDER_CREATED}:${input.timestampMs}:${Math.random()}`,
      event: SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
      tenantId: input.tenantId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      timestampMs: input.timestampMs,
    };

    tenantEvents.unshift(event);
    if (tenantEvents.length > 500) tenantEvents.length = 500;
    this.eventsByTenant.set(input.tenantId, tenantEvents);
  }
}

