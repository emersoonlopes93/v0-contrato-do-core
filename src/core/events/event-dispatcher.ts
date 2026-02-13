import { getPrismaClient } from "@/src/adapters/prisma/client";
import { eventStore } from "./event-store.repository";
import { reliableEventBus } from "./reliable-event-bus";
import type { DomainEvent, EventHandler } from "./contracts";

const prisma = getPrismaClient();

export class EventDispatcher {
  private isRunning = false;
  private readonly BATCH_SIZE = 10;
  private readonly HANDLER_TIMEOUT = 3000; // 3s

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
    console.log("Event Dispatcher started.");
  }

  private async loop() {
    while (this.isRunning) {
      try {
        await reliableEventBus.flushFallback();

        const events = await eventStore.getPendingBatch(this.BATCH_SIZE);
        
        if (events.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep 1s if empty
          continue;
        }

        // Process in parallel but limit concurrency if needed? 
        // For now, map implies parallel start, but await Promise.all waits for all.
        await Promise.all(events.map((e) => this.processEvent(e)));
        
      } catch (error) {
        console.error("Error in event dispatcher loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async processEvent(eventData: any) {
    const eventId = eventData.id;
    
    // Check backoff if it's a retry
    if (eventData.status === "failed" && eventData.processed_at) {
      const delay = Math.pow(2, eventData.retries) * 1000;
      const nextRetry = new Date(eventData.processed_at.getTime() + delay);
      if (new Date() < nextRetry) {
        return; // Not ready yet
      }
    }

    try {
      await eventStore.markProcessing(eventId);

      const handlers = reliableEventBus.getHandlers(eventData.event_name);
      
      if (!handlers || handlers.size === 0) {
        await eventStore.markProcessed(eventId);
        return;
      }

      const domainEvent: DomainEvent = {
        id: eventId,
        type: eventData.event_name,
        tenantId: eventData.tenant_id,
        userId: eventData.payload._meta?.userId,
        timestamp: eventData.occurred_at,
        data: eventData.payload,
      };

      for (const handler of handlers) {
        await this.executeHandler(handler, domainEvent);
      }

      await eventStore.markProcessed(eventId);

    } catch (error) {
      console.error(`Failed to process event ${eventId}:`, error);
      await eventStore.markFailed(eventId);
    }
  }

  private async executeHandler(handler: EventHandler, event: DomainEvent) {
    const consumerName = handler.constructor.name;
    
    // Check idempotency
    const processed = await prisma.eventConsumer.findUnique({
      where: {
        event_id_consumer_name: {
          event_id: event.id,
          consumer_name: consumerName,
        },
      },
    });

    if (processed) {
      return; // Already processed
    }

    // Execute with timeout
    try {
        await Promise.race([
            handler.handle(event),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Handler timeout")), this.HANDLER_TIMEOUT)
            )
        ]);
        
        // Record success
        await prisma.eventConsumer.create({
            data: {
                event_id: event.id,
                consumer_name: consumerName,
            }
        });

    } catch (err) {
        throw err; // Propagate to mark event as failed (so it retries)
    }
  }
}

export const eventDispatcher = new EventDispatcher();
