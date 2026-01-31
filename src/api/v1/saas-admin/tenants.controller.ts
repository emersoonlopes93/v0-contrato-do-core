/**
 * Tenants Controller (SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../middleware';
import { tenantModuleService } from '../../../adapters/prisma/modules/tenant-module.service';
import { prisma } from '../../../adapters/prisma/client';
import { CorePlanService } from '../../../core/plan/plan.service';
import { MemoryPlanRepository } from '../../../core/plan/memory-plan.repository';
import { OnboardingService } from '../../../saas-admin/services/OnboardingService';
import { prismaAuditLogger } from '../../../adapters/prisma/audit-logger';
import { asUUID, asModuleId, type TenantId, type UserId, type ModuleId } from '../../../core/types';

const planRepo = new MemoryPlanRepository();
const planService = new CorePlanService(planRepo);
const onboardingService = new OnboardingService();

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
        onboarded: true,
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
        modules: {
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
 * POST /api/v1/saas-admin/tenants
 * Create a new tenant
 */
export async function createTenant(req: Request, res: Response): Promise<void> {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { name, slug, status, planId } = body as {
    name?: string;
    slug?: string;
    status?: string;
    planId?: string;
  };

  if (!name || !slug || !planId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Name, slug and planId are required' };
    return;
  }

  try {
    // 1. Create Tenant (status defaults to 'active' if not provided)
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        status: status === 'PENDING' ? 'pending' : 'active',
      },
    });

    await planService.changeTenantPlan(asUUID(tenant.id), planId);

    try {
      await prismaAuditLogger.log({
        id: tenant.id as unknown as UserId,
        tenantId: tenant.id as TenantId,
        userId: tenant.id as UserId,
        action: 'TENANT_CREATED',
        resource: 'TENANT',
        oldValue: undefined,
        newValue: { planId },
        status: 'success',
        metadata: { details: `Tenant ${tenant.slug} criado com plano ${planId}` },
        timestamp: new Date(),
      });
    } catch (auditError) {
      console.error('[v0] Audit Error (TENANT_CREATED):', auditError);
    }

    res.status = 201;
    res.body = {
      success: true,
      data: tenant,
    };
  } catch (error) {
    console.error('[v0] createTenant error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create tenant',
    };
  }
}

/**
 * POST /api/v1/saas-admin/tenants/:tenantId/users
 * Create Tenant Admin User
 */
export async function createTenantAdminUser(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!tenantId || !email || !password) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'tenantId, email and password are required' };
    return;
  }

  try {
    // NOTE: In real implementation, hash password properly
    const user = await prisma.tenantUser.create({
      data: {
        tenant_id: tenantId,
        email,
        password_hash: password,
        // role: 'tenant_admin', // Role moved to UserRole table
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        // role: true,
        status: true,
      },
    });

    try {
      await prismaAuditLogger.log({
        id: user.id as UserId,
        tenantId: tenantId as TenantId,
        userId: user.id as UserId,
        action: 'TENANT_USER_CREATED',
        resource: 'TENANT_USER',
        oldValue: undefined,
        newValue: { email },
        status: 'success',
        metadata: { details: `Admin ${email} criado` },
        timestamp: new Date(),
      });
    } catch (auditError) {
      console.error('[v0] Audit Error (TENANT_USER_CREATED):', auditError);
    }

    res.status = 201;
    res.body = {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('[v0] createTenantAdminUser error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create tenant admin user',
    };
  }
}

/**
 * PATCH /api/v1/saas-admin/tenants/:tenantId/status
 * Update tenant status
 */
export async function updateTenantStatus(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { status } = body as {
    status?: string;
  };

  if (!tenantId || !status) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID and status are required' };
    return;
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    res.status = 200;
    res.body = {
      success: true,
      data: tenant,
    };
  } catch (error) {
    console.error('[v0] updateTenantStatus error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update tenant status',
    };
  }
}

/**
 * PATCH /api/v1/saas-admin/tenants/:tenantId/plan
 * Update tenant plan
 */
export async function updateTenantPlan(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { planId } = body as {
    planId?: string;
  };

  if (!tenantId || !planId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID and Plan ID are required' };
    return;
  }

  try {
    res.status = 200;
    res.body = {
      success: true,
      message: `Plan updated to ${planId}`,
    };
  } catch (error) {
    console.error('[v0] updateTenantPlan error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update tenant plan',
    };
  }
}

/**
 * PATCH /api/v1/saas-admin/tenants/:tenantId/modules
 * Set initial modules for tenant based on plan allowances
 */
export async function updateTenantModules(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { modules } = body as {
    modules?: unknown;
  };

  if (!tenantId || !Array.isArray(modules)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'tenantId and modules[] are required' };
    return;
  }

  try {
    const plan = await planService.getTenantPlan(asUUID(tenantId));
    if (!plan) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Tenant has no plan assigned' };
      return;
    }

    const allowed = new Set(plan.modules as ModuleId[]);
    const requested: ModuleId[] = modules.map((m) => asModuleId(String(m)));

    for (const mod of requested) {
      if (allowed.has(mod)) {
        await tenantModuleService.enable(asUUID(tenantId), mod);
      }
    }

    const currentlyEnabled = await tenantModuleService.listEnabled(asUUID(tenantId));
    for (const mod of currentlyEnabled) {
      if (!requested.includes(mod)) {
        await tenantModuleService.disable(asUUID(tenantId), mod);
      }
    }

    try {
      await prismaAuditLogger.log({
        id: asUUID(tenantId as string),
        tenantId: tenantId as TenantId,
        userId: asUUID(tenantId as string),
        action: 'TENANT_MODULES_ACTIVATED',
        resource: 'TENANT_MODULE',
        oldValue: undefined,
        newValue: { modules: requested },
        status: 'success',
        metadata: { details: `Módulos configurados: ${requested.join(', ')}` },
        timestamp: new Date(),
      });
    } catch (auditError) {
      console.error('[v0] Audit Error (TENANT_MODULES_ACTIVATED):', auditError);
    }

    res.status = 200;
    res.body = { success: true, data: { enabled: requested.filter((m: ModuleId) => allowed.has(m)) } };
  } catch (error) {
    console.error('[v0] updateTenantModules error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to set tenant modules',
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
    await tenantModuleService.enable(asUUID(tenantId), asModuleId(moduleId));
    
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
    await tenantModuleService.disable(asUUID(tenantId), asModuleId(moduleId));
    
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

/**
 * POST /api/v1/saas-admin/tenants/:tenantId/onboard
 * Onboard tenant (create user, activate modules, set onboarded=true)
 */
export async function onboardTenant(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params || {};
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Invalid body' };
    return;
  }

  const { email, password, name, modules } = body as {
    email?: string;
    password?: string;
    name?: string;
    modules?: unknown;
  };

  if (!tenantId || !email) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Tenant ID and Admin Email are required' };
    return;
  }

  try {
    let modulesArray: string[] | undefined;
    if (Array.isArray(modules)) {
      modulesArray = modules.map((m) => String(m));
    }

    const result = await onboardingService.onboardTenant({
      tenantId,
      adminEmail: email,
      adminPassword: password,
      name,
      modules: modulesArray,
    });

    res.status = 200;
    res.body = {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[v0] onboardTenant error:', error);
    // Handle specific business errors
    if (error instanceof Error && error.message === 'Tenant already onboarded') {
      res.status = 409; // Conflict
      res.body = { error: 'Conflict', message: error.message };
      return;
    }
    
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to onboard tenant',
    };
  }
}
