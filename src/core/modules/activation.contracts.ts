/**
 * Tenant Module Activation Contracts
 * 
 * Core contracts for tenant-scoped module activation.
 * Core is NEUTRAL and only knows module IDs.
 */

import type { ModuleId, TenantId } from '../types/index';

/**
 * Tenant Module Service
 * 
 * Manages module activation per tenant.
 * All operations are tenant-scoped.
 */
export interface ITenantModuleService {
  /**
   * Enable a module for a tenant
   * @throws Error if module_id does not exist in ModuleRegistry
   */
  enable(tenantId: TenantId, moduleId: ModuleId): Promise<void>;

  /**
   * Disable a module for a tenant (soft delete)
   * Sets disabled_at timestamp
   */
  disable(tenantId: TenantId, moduleId: ModuleId): Promise<void>;

  /**
   * Check if a module is enabled for a tenant
   * @returns true if enabled (status='active' and disabled_at is null)
   */
  isEnabled(tenantId: TenantId, moduleId: ModuleId): Promise<boolean>;

  /**
   * List all enabled modules for a tenant
   * @returns Array of enabled module IDs
   */
  listEnabled(tenantId: TenantId): Promise<ModuleId[]>;

  /**
   * Get detailed information about tenant modules
   * @returns Array of tenant module records with metadata
   */
  listEnabledWithDetails(
    tenantId: TenantId
  ): Promise<Array<{
    moduleId: ModuleId;
    status: string;
    activatedAt: Date;
    deactivatedAt: Date | null;
  }>>;
}
