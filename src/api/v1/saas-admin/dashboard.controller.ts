import type { Request, Response } from '../middleware';
import { prisma } from '../../../adapters/prisma/client';
import { globalModuleRegistry } from '../../../core/modules/registry';
import { asModuleId } from '../../../core/types';

/**
 * GET /api/v1/admin/dashboard
 * Read-only global metrics
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const registeredModules = await globalModuleRegistry.listRegisteredModules();
    const visibleModuleSlugs = registeredModules
      .filter(
        (module) =>
          module.id !== asModuleId('hello-module') &&
          module.type !== 'driver-app' &&
          module.scope !== 'public',
      )
      .map((module) => module.id);

    const [totalTenants, activeTenants, suspendedTenants, totalUsers, activeModulesDistinct] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'active' } }),
        prisma.tenant.count({ where: { status: 'suspended' } }),
        prisma.tenantUser.count(),
        prisma.tenantModule
          .findMany({
            where: {
              status: 'active',
              module: {
                slug: { in: visibleModuleSlugs },
              },
            },
            distinct: ['module_id'],
            select: { module_id: true },
          })
          .then((rows) => rows.length),
      ]);

    let recentEvents: Array<{ id: string; action: string; resource: string; timestamp: string }> = [];
    try {
      const events = await prisma.auditEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: { id: true, action: true, resource: true, timestamp: true },
      });
      recentEvents = events.map((e) => ({
        id: String(e.id),
        action: e.action,
        resource: e.resource,
        timestamp: (e.timestamp as unknown as Date).toISOString(),
      }));
    } catch {
      recentEvents = [];
    }

    res.status = 200;
    res.body = {
      success: true,
      data: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        activeModules: activeModulesDistinct,
        recentEvents,
      },
    };
  } catch (error: unknown) {
    console.error('[v0] getDashboard error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to load dashboard',
    };
  }
}
