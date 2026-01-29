/**
 * Tenant Module Service - Prisma Adapter
 * 
 * Implements ITenantModuleService using Prisma.
 * All queries include tenant_id (mandatory).
 */

import { getPrismaClient } from '../client';
import { globalModuleRegistry } from '../../../core/modules/registry';
import type { ITenantModuleService } from '../../../core/modules/activation.contracts';
import type { ModuleId, TenantId } from '../../../core/types/index';

export class PrismaTenantModuleService implements ITenantModuleService {
  private prisma = getPrismaClient();

  /**
   * Enable a module for a tenant
   * Validates that module exists in ModuleRegistry first
   */
  async enable(tenantId: TenantId, moduleId: ModuleId): Promise<void> {
    // MANDATORY: Validate module exists in registry
    const moduleDefinition = await globalModuleRegistry.getModuleDefinition(moduleId);
    if (!moduleDefinition) {
      throw new Error(`Module ${moduleId} not registered in ModuleRegistry`);
    }

    // Check if module is already enabled
    const existing = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: moduleId,
        },
      },
    });

    if (existing) {
      // Re-enable if it was disabled
      if (existing.status === 'inactive' || existing.deactivated_at) {
        await this.prisma.tenantModule.update({
          where: {
            tenant_id_module_id: {
              tenant_id: tenantId,
              module_id: moduleId,
            },
          },
          data: {
            status: 'active',
            deactivated_at: null,
            activated_at: new Date(),
          },
        });
      }
      return;
    }

    // Create new tenant module activation
    await this.prisma.tenantModule.create({
      data: {
        tenant_id: tenantId,
        module_id: moduleId,
        status: 'active',
        activated_at: new Date(),
      },
    });
  }

  /**
   * Disable a module for a tenant (soft delete)
   */
  async disable(tenantId: TenantId, moduleId: ModuleId): Promise<void> {
    const existing = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: moduleId,
        },
      },
    });

    if (!existing) {
      // Module not enabled, nothing to do
      return;
    }

    // Soft disable
    await this.prisma.tenantModule.update({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: moduleId,
        },
      },
      data: {
        status: 'inactive',
        deactivated_at: new Date(),
      },
    });
  }

  /**
   * Check if a module is enabled for a tenant
   */
  async isEnabled(tenantId: TenantId, moduleId: ModuleId): Promise<boolean> {
    const tenantModule = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: moduleId,
        },
      },
    });

    if (!tenantModule) {
      return false;
    }

    // Enabled if status is active AND not deactivated
    return tenantModule.status === 'active' && tenantModule.deactivated_at === null;
  }

  /**
   * List all enabled modules for a tenant
   */
  async listEnabled(tenantId: TenantId): Promise<ModuleId[]> {
    const tenantModules = await this.prisma.tenantModule.findMany({
      where: {
        tenant_id: tenantId,
        status: 'active',
        deactivated_at: null,
      },
      select: {
        module_id: true,
      },
    });

    return tenantModules.map((tm) => tm.module_id);
  }

  /**
   * List enabled modules with detailed metadata
   */
  async listEnabledWithDetails(
    tenantId: TenantId
  ): Promise<
    Array<{
      moduleId: ModuleId;
      status: string;
      activatedAt: Date;
      deactivatedAt: Date | null;
    }>
  > {
    const tenantModules = await this.prisma.tenantModule.findMany({
      where: {
        tenant_id: tenantId,
        status: 'active',
        deactivated_at: null,
      },
      select: {
        module_id: true,
        status: true,
        activated_at: true,
        deactivated_at: true,
      },
    });

    return tenantModules.map((tm) => ({
      moduleId: tm.module_id,
      status: tm.status,
      activatedAt: tm.activated_at,
      deactivatedAt: tm.deactivated_at,
    }));
  }
}

// Singleton instance
export const tenantModuleService = new PrismaTenantModuleService();
