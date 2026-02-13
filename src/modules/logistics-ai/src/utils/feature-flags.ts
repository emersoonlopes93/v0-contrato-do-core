import { LogisticsAiLogger } from './logistics-ai.logger';

export interface TenantPlanInfo {
  plan: 'free' | 'pro' | 'enterprise';
  features: {
    delayPrediction: boolean;
    routeOptimization: boolean;
    autoAlerts: boolean;
  };
}

export class LogisticsAiFeatureFlags {
  private static tenantPlans: Map<string, TenantPlanInfo> = new Map();

  static async canUseLogisticsAI(tenantId: string): Promise<boolean> {
    try {
      const planInfo = await this.getTenantPlanInfo(tenantId);
      
      if (!planInfo) {
        LogisticsAiLogger.warn(tenantId, 'Tenant plan info not found', {
          decisionType: 'feature_flag'
        });
        return false;
      }

      const isAllowed = planInfo.plan !== 'free' && 
                      (planInfo.features.delayPrediction || planInfo.features.routeOptimization);

      if (!isAllowed) {
        LogisticsAiLogger.info(tenantId, 'Logistics AI access denied by feature flag', {
          decisionType: 'feature_flag',
          metadata: {
            plan: planInfo.plan,
            delayPrediction: planInfo.features.delayPrediction,
            routeOptimization: planInfo.features.routeOptimization,
            autoAlerts: planInfo.features.autoAlerts
          }
        });
      }

      return isAllowed;
    } catch (error) {
      LogisticsAiLogger.error(tenantId, 'Error checking feature flags', error as Error, {
        decisionType: 'feature_flag'
      });
      return false;
    }
  }

  static async canUseDelayPrediction(tenantId: string): Promise<boolean> {
    const canUseAI = await this.canUseLogisticsAI(tenantId);
    if (!canUseAI) return false;

    const planInfo = await this.getTenantPlanInfo(tenantId);
    return planInfo?.features.delayPrediction ?? false;
  }

  static async canUseRouteOptimization(tenantId: string): Promise<boolean> {
    const canUseAI = await this.canUseLogisticsAI(tenantId);
    if (!canUseAI) return false;

    const planInfo = await this.getTenantPlanInfo(tenantId);
    return planInfo?.features.routeOptimization ?? false;
  }

  static async canUseAutoAlerts(tenantId: string): Promise<boolean> {
    const canUseAI = await this.canUseLogisticsAI(tenantId);
    if (!canUseAI) return false;

    const planInfo = await this.getTenantPlanInfo(tenantId);
    return planInfo?.features.autoAlerts ?? false;
  }

  private static async getTenantPlanInfo(tenantId: string): Promise<TenantPlanInfo | null> {
    // Check cache first
    const cached = this.tenantPlans.get(tenantId);
    if (cached) return cached;

    // Simulate async tenant plan lookup
    // In real implementation, this would query the database or external service
    const planInfo = await this.fetchTenantPlanFromDatabase(tenantId);
    
    if (planInfo) {
      // Cache for 5 minutes
      this.tenantPlans.set(tenantId, planInfo);
      setTimeout(() => {
        this.tenantPlans.delete(tenantId);
      }, 5 * 60 * 1000);
    }

    return planInfo;
  }

  private static async fetchTenantPlanFromDatabase(tenantId: string): Promise<TenantPlanInfo | null> {
    void tenantId;
    // Mock implementation - in production this would query actual tenant data
    // For now, assume all tenants are on 'pro' plan with full features
    return {
      plan: 'pro',
      features: {
        delayPrediction: true,
        routeOptimization: true,
        autoAlerts: true
      }
    };
  }

  static clearCache(tenantId?: string): void {
    if (tenantId) {
      this.tenantPlans.delete(tenantId);
    } else {
      this.tenantPlans.clear();
    }
  }

  static setTenantPlanInfo(tenantId: string, planInfo: TenantPlanInfo): void {
    this.tenantPlans.set(tenantId, planInfo);
  }
}
