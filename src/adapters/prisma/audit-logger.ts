import { prisma } from './client';
import type { Prisma } from '@prisma/client';
import type { AuditLogger } from '../../core/events/contracts';
import type { AuditEvent, TenantId, UserId } from '../../core/types';

class PrismaAuditLogger implements AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    await prisma.auditEvent.create({
      data: {
        id: event.id,
        tenant_id: event.tenantId,
        user_id: event.userId,
        action: event.action,
        resource: event.resource,
        old_value: event.oldValue as unknown as never,
        new_value: event.newValue as unknown as never,
        status: event.status,
        metadata: event.metadata as unknown as never,
        timestamp: event.timestamp,
      },
    });
  }

  async getEvents(tenantId?: TenantId, userId?: UserId, limit?: number): Promise<AuditEvent[]> {
    const where: Prisma.AuditEventWhereInput = {};

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    if (userId) {
      where.user_id = userId;
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit ?? 100,
    });

    return events.map<AuditEvent>((e) => ({
      id: e.id as AuditEvent['id'],
      tenantId: e.tenant_id as TenantId | undefined,
      userId: e.user_id as UserId,
      action: e.action,
      resource: e.resource,
      oldValue: e.old_value as unknown,
      newValue: e.new_value as unknown,
      status: e.status === 'failure' ? 'failure' : 'success',
      metadata: e.metadata as unknown as Record<string, unknown> | undefined,
      timestamp: e.timestamp,
    }));
  }

  async getEventsByAction(action: string, tenantId?: TenantId): Promise<AuditEvent[]> {
    const where: Prisma.AuditEventWhereInput = {
      action,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return events.map<AuditEvent>((e) => ({
      id: e.id as AuditEvent['id'],
      tenantId: e.tenant_id as TenantId | undefined,
      userId: e.user_id as UserId,
      action: e.action,
      resource: e.resource,
      oldValue: e.old_value as unknown,
      newValue: e.new_value as unknown,
      status: e.status === 'failure' ? 'failure' : 'success',
      metadata: e.metadata as unknown as Record<string, unknown> | undefined,
      timestamp: e.timestamp,
    }));
  }
}

export const prismaAuditLogger = new PrismaAuditLogger();

