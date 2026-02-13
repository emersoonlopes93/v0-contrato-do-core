import type { DomainEvent, EventBus, EventHandler, AuditLogger } from "./contracts";
import type { AuditEvent } from "../types";
import { reliableEventBus } from "./reliable-event-bus";
import { eventDispatcher } from "./event-dispatcher";

// Start the reliable event dispatcher
eventDispatcher.start();

class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

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
    const eventHandlers = this.handlers.get(event.type);
    if (eventHandlers) {
      await Promise.all(Array.from(eventHandlers).map((h) => h.handle(event)));
    }
  }

  async publishMultiple(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e)));
  }
}

class InMemoryAuditLogger implements AuditLogger {
  private events: AuditEvent[] = [];

  async log(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  async getEvents(
    tenantId?: string,
    userId?: string,
    limit?: number
  ): Promise<AuditEvent[]> {
    let filtered = this.events;

    if (tenantId) {
      filtered = filtered.filter((e) => e.tenantId === tenantId);
    }
    if (userId) {
      filtered = filtered.filter((e) => e.userId === userId);
    }

    return filtered.slice(0, limit || 100);
  }

  async getEventsByAction(action: string, tenantId?: string): Promise<AuditEvent[]> {
    let filtered = this.events.filter((e) => e.action === action);

    if (tenantId) {
      filtered = filtered.filter((e) => e.tenantId === tenantId);
    }

    return filtered;
  }
}

export const globalEventBus = reliableEventBus;
export const globalAuditLogger = new InMemoryAuditLogger();
