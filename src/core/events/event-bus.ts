import type { AuditLogger } from "./contracts";
import type { AuditEvent } from "../types";
import { reliableEventBus } from "./reliable-event-bus";
import { eventDispatcher } from "./event-dispatcher";
import { getPrismaClient } from "@/src/adapters/prisma/client";
import { Prisma } from "@prisma/client";
import { asUUID } from "../types";

eventDispatcher.start();

class PrismaAuditLogger implements AuditLogger {
  private prisma = getPrismaClient();

  async log(event: AuditEvent): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        id: event.id,
        tenant_id: event.tenantId ?? null,
        user_id: event.userId,
        action: event.action,
        resource: event.resource,
        old_value: (event.oldValue === undefined ? Prisma.JsonNull : (event.oldValue as Prisma.InputJsonValue)),
        new_value: (event.newValue === undefined ? Prisma.JsonNull : (event.newValue as Prisma.InputJsonValue)),
        status: event.status,
        metadata: event.metadata ?? {},
        timestamp: event.timestamp,
      },
    });
  }

  async getEvents(
    tenantId?: string,
    userId?: string,
    limit?: number
  ): Promise<AuditEvent[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        tenant_id: tenantId ?? undefined,
        user_id: userId ?? undefined,
      },
      orderBy: { timestamp: 'desc' },
      take: limit ?? 100,
    });

    return rows.map((row) => ({
      id: asUUID(row.id),
      tenantId: row.tenant_id ? asUUID(row.tenant_id) : undefined,
      userId: asUUID(row.user_id ?? ''),
      action: row.action,
      resource: row.resource,
      oldValue: row.old_value ?? undefined,
      newValue: row.new_value ?? undefined,
      status: row.status as 'success' | 'failure',
      metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
      timestamp: row.timestamp,
    }));
  }

  async getEventsByAction(action: string, tenantId?: string): Promise<AuditEvent[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        action,
        tenant_id: tenantId ?? undefined,
      },
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((row) => ({
      id: asUUID(row.id),
      tenantId: row.tenant_id ? asUUID(row.tenant_id) : undefined,
      userId: asUUID(row.user_id ?? ''),
      action: row.action,
      resource: row.resource,
      oldValue: row.old_value ?? undefined,
      newValue: row.new_value ?? undefined,
      status: row.status as 'success' | 'failure',
      metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
      timestamp: row.timestamp,
    }));
  }
}

export const globalEventBus = reliableEventBus;
export const globalAuditLogger = new PrismaAuditLogger();
