import type { DomainEvent, EventBus, EventHandler } from "./contracts";
import { eventStore } from "./event-store.repository";

class ReliableEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private fallbackQueue: DomainEvent[] = [];
  public metrics = {
    published: 0,
    persisted: 0,
    persistFailed: 0,
    fallbackQueued: 0,
    flushed: 0,
    processed: 0,
    failed: 0,
  };

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    this.metrics.published++;
    try {
      await eventStore.append({
        tenant_id: event.tenantId || null,
        event_name: event.type,
        aggregate_type: null,
        aggregate_id: (event.data.id as string) || (event.data.aggregateId as string) || null,
        payload: {
          ...event.data,
          _meta: {
            userId: event.userId,
            timestamp: event.timestamp,
            eventId: event.id,
          },
        },
        version: 1,
        occurred_at: event.timestamp || new Date(),
      });
      this.metrics.persisted++;
    } catch (error) {
      this.metrics.persistFailed++;
      this.fallbackQueue.push(event);
      this.metrics.fallbackQueued++;
    }
  }

  async publishMultiple(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }

  getHandlers(eventType: string): Set<EventHandler> | undefined {
    return this.handlers.get(eventType);
  }

  async flushFallback(): Promise<void> {
    if (this.fallbackQueue.length === 0) return;

    const eventsToRetry = [...this.fallbackQueue];
    this.fallbackQueue = [];

    this.metrics.flushed += eventsToRetry.length;
    for (const event of eventsToRetry) {
      await this.publish(event);
    }
  }
}

export const reliableEventBus = new ReliableEventBus();
