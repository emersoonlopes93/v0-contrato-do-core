import type { TenantId, Plan, ModuleId } from "../types/index";

export interface PlanService {
  getPlanById(planId: string): Promise<Plan | null>;
  listAllPlans(): Promise<Plan[]>;
  checkModuleInPlan(planId: string, moduleId: ModuleId): Promise<boolean>;
  checkPlanLimit(planId: string, limitKey: string): Promise<number>;
}

export interface TenantPlanService {
  getTenantPlan(tenantId: TenantId): Promise<Plan | null>;
  changeTenantPlan(tenantId: TenantId, newPlanId: string): Promise<void>;
  checkTenantHasModule(tenantId: TenantId, moduleId: ModuleId): Promise<boolean>;
  checkTenantLimit(tenantId: TenantId, limitKey: string): Promise<number>;
  incrementTenantUsage(tenantId: TenantId, limitKey: string, amount: number): Promise<void>;
}

export interface PlanRepository {
  savePlan(plan: Plan): Promise<void>;
  getPlanById(planId: string): Promise<Plan | null>;
  listPlans(): Promise<Plan[]>;
  getTenantPlan(tenantId: TenantId): Promise<Plan | null>;
  updateTenantPlan(tenantId: TenantId, planId: string): Promise<void>;
  getTenantUsage(tenantId: TenantId, limitKey: string): Promise<number>;
  incrementUsage(tenantId: TenantId, limitKey: string, amount: number): Promise<void>;
}
