import { Plan as PlanType, TenantId, asModuleId } from "../types";
import { PlanRepository } from "./contracts";

// Helper to simulate async db calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_PLANS: PlanType[] = [
  {
    id: "plan_free",
    slug: "free",
    name: "Free",
    description: "Basic plan for starters",
    modules: [asModuleId("hello-module")],
    limits: {
      "users": 3,
      "storage_mb": 100,
      "api_calls_daily": 1000
    },
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "plan_pro",
    slug: "pro",
    name: "Pro",
    description: "For growing businesses",
    modules: [asModuleId("hello-module"), asModuleId("reports-module")], 
    limits: {
      "users": 10,
      "storage_mb": 1000,
      "api_calls_daily": 10000
    },
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "plan_enterprise",
    slug: "enterprise",
    name: "Enterprise",
    description: "Unlimited power",
    modules: [
      asModuleId("hello-module"),
      asModuleId("reports-module"),
      asModuleId("audit-module"),
    ],
    limits: {
      "users": -1,
      "storage_mb": -1,
      "api_calls_daily": -1
    },
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class MemoryPlanRepository implements PlanRepository {
  private plans: Map<string, PlanType> = new Map();
  private tenantPlans: Map<string, string> = new Map(); // tenantId -> planId
  private tenantUsage: Map<string, Record<string, number>> = new Map(); // tenantId -> { limitKey: amount }

  constructor() {
    // Seed default plans
    DEFAULT_PLANS.forEach(plan => this.plans.set(plan.id, plan));
  }

  async savePlan(plan: PlanType): Promise<void> {
    await delay(50);
    this.plans.set(plan.id, plan);
  }

  async getPlanById(planId: string): Promise<PlanType | null> {
    await delay(50);
    return this.plans.get(planId) || null;
  }

  async listPlans(): Promise<PlanType[]> {
    await delay(50);
    return Array.from(this.plans.values());
  }

  async getTenantPlan(tenantId: TenantId): Promise<PlanType | null> {
    await delay(50);
    const planId = this.tenantPlans.get(tenantId);
    // Default to free plan if not assigned
    if (!planId) return this.plans.get("plan_free") || null;
    return this.plans.get(planId) || null;
  }

  async updateTenantPlan(tenantId: TenantId, planId: string): Promise<void> {
    await delay(50);
    if (!this.plans.has(planId)) throw new Error(`Plan ${planId} not found`);
    this.tenantPlans.set(tenantId, planId);
  }

  async getTenantUsage(tenantId: TenantId, limitKey: string): Promise<number> {
    await delay(20);
    const usage = this.tenantUsage.get(tenantId) || {};
    return usage[limitKey] || 0;
  }

  async incrementUsage(tenantId: TenantId, limitKey: string, amount: number): Promise<void> {
    await delay(20);
    const usage = this.tenantUsage.get(tenantId) || {};
    usage[limitKey] = (usage[limitKey] || 0) + amount;
    this.tenantUsage.set(tenantId, usage);
  }
}
