import type { EventBus, EventHandler, DomainEvent } from '@/src/core/events/contracts';
import { ORDERS_EVENTS } from '../events';

export class OrdersListener implements EventHandler {
  constructor(private readonly eventBus: EventBus) {}

  register(): void {
    this.eventBus.subscribe(ORDERS_EVENTS.ORDER_CREATED, this);
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.type !== ORDERS_EVENTS.ORDER_CREATED) {
      return;
    }

    console.log('[OrdersModule] Order created event received:', event);
  }
}
