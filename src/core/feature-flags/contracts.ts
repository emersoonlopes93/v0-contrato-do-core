export type FeatureFlagId = string;

export interface FeatureFlagContext {
  tenantId?: string;
  userId?: string;
  role?: string;
  planId?: string;
}

export interface FeatureFlagRule {
  id: FeatureFlagId;
  tenantId?: string;
  userId?: string;
  role?: string;
  planId?: string;
  enabled: boolean;
}

export interface FeatureFlagProvider {
  isEnabled(flagId: FeatureFlagId, context: FeatureFlagContext): Promise<boolean>;
}

