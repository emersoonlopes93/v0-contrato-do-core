/**
 * Plans Controller (SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../middleware';
import { CorePlanService } from '../../../core/plan/plan.service';
import { MemoryPlanRepository } from '../../../core/plan/memory-plan.repository';
import { asModuleId, type Plan } from '../../../core/types';

// Instantiate service (in a real app, use dependency injection)
const planRepo = new MemoryPlanRepository();
const planService = new CorePlanService(planRepo);

/**
 * GET /api/v1/saas-admin/plans
 * List all plans
 */
export async function listPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await planService.listAllPlans();
    
    res.status = 200;
    res.body = {
      success: true,
      data: plans,
    };
  } catch (error) {
    console.error('[v0] listPlans error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to list plans',
    };
  }
}

/**
 * POST /api/v1/saas-admin/plans
 * Create a new plan
 */

function isCreatePlanBody(body: unknown): body is {
  name: string;
  description?: unknown;
  limits?: unknown;
  modules?: unknown;
} {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  return typeof candidate.name === 'string';
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  const rawBody = req.body;

  if (!isCreatePlanBody(rawBody)) {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Name is required',
    };
    return;
  }

  const { name, description, limits, modules } = rawBody;

  const safeDescription =
    typeof description === 'string' ? description : '';

  const safeModules =
    Array.isArray(modules) && modules.every((m) => typeof m === 'string')
      ? (modules as string[])
      : [];

  const safeLimits: Record<string, number> =
    limits && typeof limits === 'object'
      ? (Object.fromEntries(
          Object.entries(limits as Record<string, unknown>).filter(
            ([, value]) => typeof value === 'number',
          ),
        ) as Record<string, number>)
      : {};

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      slug,
      name,
      description: safeDescription,
      modules: safeModules.map((m) => asModuleId(m)),
      limits: safeLimits,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await planRepo.savePlan(newPlan);
    
    res.status = 201;
    res.body = {
      success: true,
      data: newPlan,
    };
  } catch (error: unknown) {
    console.error('[v0] createPlan error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create plan',
    };
  }
}

/**
 * PATCH /api/v1/saas-admin/plans/:id
 * Update a plan
 */
export async function updatePlan(req: Request, res: Response): Promise<void> {
  const { id } = req.params || {};
  const updates =
    typeof req.body === 'object' && req.body !== null
      ? (req.body as Partial<Plan>)
      : {};

  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Plan ID is required' };
    return;
  }

  try {
    const existingPlan = await planService.getPlanById(id);
    
    if (!existingPlan) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Plan not found' };
      return;
    }

    const updatedPlan = {
      ...existingPlan,
      ...updates,
      updatedAt: new Date()
    };

    await planRepo.savePlan(updatedPlan);
    
    res.status = 200;
    res.body = {
      success: true,
      data: updatedPlan,
    };
  } catch (error: unknown) {
    console.error('[v0] updatePlan error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update plan',
    };
  }
}
