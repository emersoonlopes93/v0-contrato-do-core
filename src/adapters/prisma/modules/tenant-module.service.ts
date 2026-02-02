/**
 * Tenant Module Service - Prisma Adapter
 * 
 * Implements ITenantModuleService using Prisma.
 * All queries include tenant_id (mandatory).
 */

import { getPrismaClient } from '../client';
import { globalModuleRegistry } from '../../../core/modules/registry';
import type { ITenantModuleService } from '../../../core/modules/activation.contracts';
import type { ModuleRegisterPayload } from '../../../core/modules/contracts';
import type { ModuleId, TenantId } from '../../../core/types/index';
import { asModuleId } from '../../../core/types';

export class PrismaTenantModuleService implements ITenantModuleService {
  private prisma = getPrismaClient();

  private async resolveDbModuleIdOrNull(moduleId: ModuleId): Promise<string | null> {
    const moduleRecord = await this.prisma.module.findFirst({
      where: {
        OR: [{ id: moduleId }, { slug: moduleId }],
      },
      select: { id: true },
    });

    return moduleRecord?.id ?? null;
  }

  private async resolveDbModuleId(moduleId: ModuleId, definition: ModuleRegisterPayload): Promise<string> {
    const existingId = await this.resolveDbModuleIdOrNull(moduleId);
    if (existingId) {
      return existingId;
    }

    const created = await this.prisma.module.create({
      data: {
        slug: moduleId,
        name: definition.name,
        version: definition.version,
        description: definition.description ?? definition.name,
        required_plan: definition.requiredPlan ?? null,
        permissions: definition.permissions.map((p) => p.id),
        events: definition.eventTypes.map((e) => e.id),
        status: 'active',
      },
      select: { id: true },
    });

    return created.id;
  }

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

    const dbModuleId = await this.resolveDbModuleId(moduleId, moduleDefinition);

    // Check if module is already enabled
    const existing = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: dbModuleId,
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
              module_id: dbModuleId,
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
        module_id: dbModuleId,
        status: 'active',
        activated_at: new Date(),
      },
    });
  }

  /**
   * Disable a module for a tenant (soft delete)
   */
  async disable(tenantId: TenantId, moduleId: ModuleId): Promise<void> {
    const dbModuleId = await this.resolveDbModuleIdOrNull(moduleId);
    if (!dbModuleId) {
      return;
    }

    const existing = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: dbModuleId,
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
          module_id: dbModuleId,
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
    const dbModuleId = await this.resolveDbModuleIdOrNull(moduleId);
    if (!dbModuleId) {
      return false;
    }

    const tenantModule = await this.prisma.tenantModule.findUnique({
      where: {
        tenant_id_module_id: {
          tenant_id: tenantId,
          module_id: dbModuleId,
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
        module: {
          select: {
            slug: true,
          },
        },
      },
    });

    return tenantModules.map((tm) => asModuleId(tm.module.slug));
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
        module: {
          select: {
            slug: true,
          },
        },
        status: true,
        activated_at: true,
        deactivated_at: true,
      },
    });

    return tenantModules.map((tm) => ({
      moduleId: asModuleId(tm.module.slug),
      status: tm.status,
      activatedAt: tm.activated_at,
      deactivatedAt: tm.deactivated_at,
    }));
  }
}

// Singleton instance
export const tenantModuleService = new PrismaTenantModuleService();
