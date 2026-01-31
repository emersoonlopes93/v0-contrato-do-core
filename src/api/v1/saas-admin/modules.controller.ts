/**
 * Modules Controller (SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../middleware';
import { globalModuleRegistry } from '../../../core/modules/registry';
import { tenantModuleService } from '../../../adapters/prisma/modules/tenant-module.service';
import { asModuleId, asUUID, type ModuleId } from '../../../core/types';

/**
 * GET /api/v1/saas-admin/modules
 * List all registered modules
 */
export async function listModules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.query?.tenantId;
    let modules = await globalModuleRegistry.listRegisteredModules();

    if (modules.length === 0) {
      await globalModuleRegistry.register({
        id: asModuleId('hello-module'),
        name: 'Hello Module',
        version: '1.0.0',
        permissions: [],
        eventTypes: [],
        requiredPlan: 'pro',
      });
      modules = await globalModuleRegistry.listRegisteredModules();
    }
    
    let activeForTenant = new Set<ModuleId>();
    if (tenantId) {
      const activeList = await tenantModuleService.listEnabled(asUUID(tenantId));
      activeForTenant = new Set(activeList);
    }

    res.status = 200;
    res.body = {
      success: true,
      data: modules.map((m) => ({
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
