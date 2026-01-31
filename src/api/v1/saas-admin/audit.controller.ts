import type { Request, Response } from '../middleware';
import { prismaAuditLogger } from '../../../adapters/prisma/audit-logger';
import type { TenantId, UserId } from '../../../core/types';

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const tenantParam = req.query?.tenant;
    const userParam = req.query?.user;
    const actionParam = req.query?.action;
    const dateParam = req.query?.date;

    const tenantId: TenantId | undefined =
      typeof tenantParam === 'string' && tenantParam.length > 0 ? (tenantParam as TenantId) : undefined;
    const userId: UserId | undefined =
      typeof userParam === 'string' && userParam.length > 0 ? (userParam as UserId) : undefined;

    let events = await prismaAuditLogger.getEvents(tenantId, userId, 500);

    if (typeof actionParam === 'string' && actionParam.length > 0) {
      const actionFiltered = await prismaAuditLogger.getEventsByAction(actionParam, tenantId);
      const actionIds = new Set(actionFiltered.map((e) => e.id));
      events = events.filter((e) => actionIds.has(e.id));
    }

    if (typeof dateParam === 'string' && dateParam.length > 0) {
      const start = new Date(dateParam);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        events = events.filter((e) => e.timestamp >= start && e.timestamp < end);
      }
    }

    const serialized = events.map((e) => ({
      id: e.id,
      action: e.action,
      resource: e.resource,
      userId: e.userId,
      tenantId: e.tenantId ?? null,
      status: e.status,
      timestamp: e.timestamp.toISOString(),
    }));

    res.status = 200;
    res.body = {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error('[v0] listAuditLogs error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list audit logs',
    };
  }
}
