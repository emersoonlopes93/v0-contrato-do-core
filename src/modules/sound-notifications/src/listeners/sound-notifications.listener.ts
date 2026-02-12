import type { DomainEvent, EventBus, EventHandler } from '@/src/core/events/contracts';
import { ORDERS_EVENTS } from '@/src/modules/orders-module/src/events';
import type { SoundNotificationsService } from '../services/sound-notifications.service';

import { isRecord } from '@/src/core/utils/type-guards';

export class SoundNotificationsListener implements EventHandler {
  constructor(
    private readonly eventBus: EventBus,
    private readonly service: SoundNotificationsService,
  ) {}

  register(): void {
    this.eventBus.subscribe(ORDERS_EVENTS.ORDER_CREATED, this);
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.type !== ORDERS_EVENTS.ORDER_CREATED) return;
    if (!isRecord(event.data)) return;

    const tenantId = event.data.tenantId;
    const orderId = event.data.orderId;
    const orderNumber = event.data.orderNumber;
    const timestamp = event.data.timestamp;

    if (typeof tenantId !== 'string' || tenantId.trim() === '') return;
    if (orderId !== null && typeof orderId !== 'string') return;
    if (orderNumber !== null && typeof orderNumber !== 'number') return;

    const timestampMs =
      typeof timestamp === 'string' && timestamp.trim() !== '' ? new Date(timestamp).getTime() : Date.now();

    this.service.recordOrderCreated({
      tenantId,
      orderId: typeof orderId === 'string' ? orderId : null,
      orderNumber: typeof orderNumber === 'number' ? orderNumber : null,
      timestampMs: Number.isFinite(timestampMs) ? timestampMs : Date.now(),
    });
  }
}

