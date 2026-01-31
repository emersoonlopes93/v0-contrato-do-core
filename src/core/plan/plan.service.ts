import { PlanService, TenantPlanService, PlanRepository } from "./contracts";
import { Plan, TenantId, ModuleId } from "../types";

export class CorePlanService implements PlanService, TenantPlanService {
  constructor(private repository: PlanRepository) {}

  // --- PlanService Implementation ---

  async getPlanById(planId: string): Promise<Plan | null> {
    return this.repository.getPlanById(planId);
  }

  async listAllPlans(): Promise<Plan[]> {
    return this.repository.listPlans();
  }

  async checkModuleInPlan(planId: string, moduleId: ModuleId): Promise<boolean> {
    const plan = await this.repository.getPlanById(planId);
    if (!plan) return false;
    return plan.modules.includes(moduleId);
  }

  async checkPlanLimit(planId: string, limitKey: string): Promise<number> {
    const plan = await this.repository.getPlanById(planId);
    if (!plan) return 0;
    
    const limit = plan.limits[limitKey];
    if (limit === undefined) return 0; // Default to 0 if not specified (safe default)
    return limit;
  }

  // --- TenantPlanService Implementation ---

  async getTenantPlan(tenantId: TenantId): Promise<Plan | null> {
    return this.repository.getTenantPlan(tenantId);
  }

  async changeTenantPlan(tenantId: TenantId, newPlanId: string): Promise<void> {
    return this.repository.updateTenantPlan(tenantId, newPlanId);
  }

  async checkTenantHasModule(tenantId: TenantId, moduleId: ModuleId): Promise<boolean> {
    const plan = await this.repository.getTenantPlan(tenantId);
    if (!plan) return false;
    return plan.modules.includes(moduleId);
  }

  async checkTenantLimit(tenantId: TenantId, limitKey: string): Promise<number> {
    const plan = await this.repository.getTenantPlan(tenantId);
    if (!plan) return 0;
    const limit = plan.limits[limitKey];
    return limit !== undefined ? limit : 0;
  }

  async incrementTenantUsage(tenantId: TenantId, limitKey: string, amount: number): Promise<void> {
    const plan = await this.repository.getTenantPlan(tenantId);
    if (!plan) throw new Error("Tenant has no plan assigned");

    const limit = plan.limits[limitKey];
    const currentUsage = await this.repository.getTenantUsage(tenantId, limitKey);

    // If limit is not unlimited (-1) and usage + amount > limit, throw error or return false?
    // The contract says "incrementTenantUsage" returns void. Usually this should enforce limits.
    // However, "enforcement" might be a separate check. 
    // Let's implement enforcement here: if it exceeds, throw error.
    
    if (limit !== undefined && limit !== -1) {
      if (currentUsage + amount > limit) {
        throw new Error(`Plan limit exceeded for ${limitKey}. Limit: ${limit}, Current: ${currentUsage}, Attempted: ${amount}`);
      }
    }

    await this.repository.incrementUsage(tenantId, limitKey, amount);
  }
  
  // Helper to get usage for UI
  async getTenantUsage(tenantId: TenantId, limitKey: string): Promise<number> {
      return this.repository.getTenantUsage(tenantId, limitKey);
  }
}
