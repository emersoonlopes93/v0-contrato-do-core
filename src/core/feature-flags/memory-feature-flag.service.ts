import type { FeatureFlagContext, FeatureFlagId, FeatureFlagProvider, FeatureFlagRule } from "./contracts";

export class MemoryFeatureFlagProvider implements FeatureFlagProvider {
  private rules: FeatureFlagRule[];

  constructor(initialRules?: FeatureFlagRule[]) {
    this.rules = initialRules ?? [];
  }

  setRules(rules: FeatureFlagRule[]): void {
    this.rules = [...rules];
  }

  async isEnabled(flagId: FeatureFlagId, context: FeatureFlagContext): Promise<boolean> {
    const relevantRules = this.rules.filter((rule) => rule.id === flagId);

    if (relevantRules.length === 0) {
      return false;
    }

    return relevantRules.some((rule) => {
      if (rule.tenantId && rule.tenantId !== context.tenantId) {
        return false;
      }

      if (rule.userId && rule.userId !== context.userId) {
        return false;
      }

      if (rule.role && rule.role !== context.role) {
        return false;
      }

      if (rule.planId && rule.planId !== context.planId) {
        return false;
      }

      return rule.enabled;
    });
  }
}

