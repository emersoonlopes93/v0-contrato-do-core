import type { Request, Response } from '../middleware';
import { globalModuleRegistry } from '../../../core/modules/registry';
import { tenantModuleService } from '../../../adapters/prisma/modules/tenant-module.service';
import { asUUID, type ModuleId } from '../../../core/types';
import { ensureTenantUiRegistry } from '@/src/modules/registry';

/**
 * GET /api/v1/saas-admin/modules
 * List all registered modules
 */
export async function listModules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.query?.tenantId;
    await ensureTenantUiRegistry();
    const modules = await globalModuleRegistry.listRegisteredModules();
    const visibleModules = modules.filter(
      (module) => module.type !== 'driver-app' && module.scope !== 'public',
    );
    
    let activeForTenant = new Set<ModuleId>();
    if (tenantId) {
      const activeList = await tenantModuleService.listEnabled(asUUID(tenantId));
      activeForTenant = new Set(activeList);
    }

    res.status = 200;
    res.body = {
      success: true,
      data: visibleModules.map((m) => ({
        ...m,
        slug: m.id,
        isActiveForTenant: tenantId ? activeForTenant.has(m.id) : false,
      })),
    };
  } catch (error) {
    console.error('[v0] listModules error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list modules',
    };
  }
}
