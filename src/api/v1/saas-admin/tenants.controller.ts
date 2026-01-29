/**
 * Tenants Controller (SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../middleware';
import { tenantModuleService } from '../../../adapters/prisma/modules/tenant-module.service';
import { prisma } from '../../../adapters/prisma/client';

interface SaaSAdminRequest extends Request {
  auth: {
    userId: string;
    role: string;
  };
}

/**
 * GET /api/v1/saas-admin/tenants
 * List all tenants
 */
export async function listTenants(req: Request, res: Response): Promise<void> {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    
    res.status = 200;
    res.body = {
      success: true,
      data: tenants,
    };
  } catch (error) {
    console.error('[v0] listTenants error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list tenants',
    };
  }
}

/**
 * GET /api/v1/saas-admin/tenants/:tenantId
 * Get tenant details
 */
export async function getTenant(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  
  if (!tenantId) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'tenantId is required',
    };
    return;
  }
  
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenant_modules: {
          where: {
            status: 'active',
            deactivated_at: null,
          },
          include: {
            module: true,
          },
        },
      },
    });
    
    if (!tenant) {
      res.status = 404;
      res.body = {
        error: 'Not Found',
        message: 'Tenant not found',
      };
      return;
    }
    
    res.status = 200;
    res.body = {
      success: true,
      data: tenant,
    };
  } catch (error) {
    console.error('[v0] getTenant error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to get tenant',
    };
  }
}

/**
 * POST /api/v1/saas-admin/tenants/:tenantId/modules/:moduleId/activate
 * Activate module for tenant
 */
export async function activateModule(req: Request, res: Response): Promise<void> {
  const { tenantId, moduleId } = req.params || {};
  
  if (!tenantId || !moduleId) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'tenantId and moduleId are required',
    };
    return;
  }
  
  try {
    await tenantModuleService.activate(tenantId, moduleId as any);
    
    res.status = 200;
    res.body = {
      success: true,
      message: `Module ${moduleId} activated for tenant ${tenantId}`,
    };
  } catch (error) {
    console.error('[v0] activateModule error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to activate module',
    };
  }
}

/**
 * POST /api/v1/saas-admin/tenants/:tenantId/modules/:moduleId/deactivate
 * Deactivate module for tenant
 */
export async function deactivateModule(req: Request, res: Response): Promise<void> {
  const { tenantId, moduleId } = req.params || {};
  
  if (!tenantId || !moduleId) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'tenantId and moduleId are required',
    };
    return;
  }
  
  try {
    await tenantModuleService.deactivate(tenantId, moduleId as any);
    
    res.status = 200;
    res.body = {
      success: true,
      message: `Module ${moduleId} deactivated for tenant ${tenantId}`,
    };
  } catch (error) {
    console.error('[v0] deactivateModule error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to deactivate module',
    };
  }
}
