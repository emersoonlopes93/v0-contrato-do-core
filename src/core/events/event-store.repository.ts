import { getPrismaClient } from "@/src/adapters/prisma/client";
import { Prisma } from "@prisma/client";

const prisma = getPrismaClient();

export interface StoredEvent {
  id: string;
  tenant_id: string | null;
  event_name: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  version: number;
  occurred_at: Date;
  processed_at: Date | null;
  status: string;
  retries: number;
}

export class EventStoreRepository {
  async append(event: Omit<StoredEvent, "id" | "processed_at" | "status" | "retries">): Promise<void> {
    await prisma.eventStore.create({
      data: {
        tenant_id: event.tenant_id,
        event_name: event.event_name,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        payload: event.payload as Prisma.InputJsonValue,
        version: event.version,
        occurred_at: event.occurred_at,
        status: "pending",
        retries: 0,
      },
    });
  }

  async markProcessing(id: string): Promise<void> {
    await prisma.eventStore.update({
      where: { id },
      data: { status: "processing" },
    });
  }

  async markProcessed(id: string): Promise<void> {
    await prisma.eventStore.update({
      where: { id },
      data: { status: "processed", processed_at: new Date() },
    });
  }

  async markFailed(id: string): Promise<void> {
    await prisma.eventStore.update({
      where: { id },
      data: { 
        status: "failed", 
        retries: { increment: 1 },
        processed_at: new Date(), // Using processed_at to track last attempt time for backoff
      },
    });
  }

  async getPendingBatch(limit: number): Promise<StoredEvent[]> {
    // Fetch pending events
    const pendingEvents = await prisma.eventStore.findMany({
      where: { status: "pending" },
      orderBy: { occurred_at: "asc" },
      take: limit,
    });

    if (pendingEvents.length >= limit) {
      return pendingEvents.map(this.mapToStoredEvent);
    }

    // Fetch failed events that need retry
    // We need to implement backoff: 
    // retry 1: > 1s
    // retry 2: > 4s
    // retry 3: > 9s, etc.
    // Since we can't easily do exponential math in prisma query without raw query,
    // we'll fetch a batch of failed ones and filter in memory or just fetch those with retries < 5.
    // For simplicity and performance, we'll just fetch failed ones and let the dispatcher decide if it's time to retry?
    // Or we can just fetch them and if we process them "too soon" it's not the end of the world, just strict busy loop.
    // To avoid busy loop, we should check time.
    
    const remainingLimit = limit - pendingEvents.length;
    const failedEvents = await prisma.eventStore.findMany({
      where: { 
        status: "failed", 
        retries: { lt: 5 } 
      },
      orderBy: { processed_at: "asc" }, // Oldest failed first
      take: remainingLimit,
    });

    const events = [...pendingEvents, ...failedEvents];
    return events.map(this.mapToStoredEvent);
  }

  private mapToStoredEvent(e: {
    id: string;
    tenant_id: string | null;
    event_name: string;
    aggregate_type: string | null;
    aggregate_id: string | null;
    payload: Prisma.JsonValue;
    version: number;
    occurred_at: Date;
    processed_at: Date | null;
    status: string;
    retries: number;
  }): StoredEvent {
    return {
      id: e.id,
      tenant_id: e.tenant_id,
      event_name: e.event_name,
      aggregate_type: e.aggregate_type,
      aggregate_id: e.aggregate_id,
      payload: e.payload as Record<string, unknown>,
      version: e.version,
      occurred_at: e.occurred_at,
      processed_at: e.processed_at,
      status: e.status,
      retries: e.retries,
    };
  }
}

export const eventStore = new EventStoreRepository();
