import type { ModuleRegisterPayload, ModuleRegistry, ModuleServiceRegistry } from "./contracts";
import type { ModuleId, TenantId } from "../types/index";

class InMemoryModuleRegistry implements ModuleRegistry {
  private modules: Map<ModuleId, ModuleRegisterPayload> = new Map();
  private tenantModules: Map<string, Set<ModuleId>> = new Map();

  async register(module: ModuleRegisterPayload): Promise<void> {
    this.modules.set(module.id, module);
  }

  async getModuleDefinition(moduleId: ModuleId): Promise<ModuleRegisterPayload | null> {
    return this.modules.get(moduleId) || null;
  }

  async listRegisteredModules(): Promise<ModuleRegisterPayload[]> {
    return Array.from(this.modules.values());
  }

  async listTenantActiveModules(tenantId: TenantId): Promise<ModuleRegisterPayload[]> {
    const activeModuleIds = this.tenantModules.get(tenantId) || new Set();
    return Array.from(activeModuleIds)
      .map((id) => this.modules.get(id))
      .filter((m) => m !== undefined) as ModuleRegisterPayload[];
  }

  async activateModuleForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<void> {
    if (!this.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} not found`);
    }
    if (!this.tenantModules.has(tenantId)) {
      this.tenantModules.set(tenantId, new Set());
    }
    this.tenantModules.get(tenantId)!.add(moduleId);
  }

  async deactivateModuleForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<void> {
    const modules = this.tenantModules.get(tenantId);
    if (modules) {
      modules.delete(moduleId);
    }
  }

  async isModuleActiveForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<boolean> {
    const modules = this.tenantModules.get(tenantId);
    return modules?.has(moduleId) ?? false;
  }
}

class InMemoryModuleServiceRegistry implements ModuleServiceRegistry {
  private services: Map<string, unknown> = new Map();

  register<T>(moduleId: ModuleId, serviceKey: string, service: T): void {
    const key = `${moduleId}:${serviceKey}`;
    this.services.set(key, service);
  }

  get<T>(moduleId: ModuleId, serviceKey: string): T | null {
    const key = `${moduleId}:${serviceKey}`;
    return (this.services.get(key) as T) || null;
  }
}

export const globalModuleRegistry = new InMemoryModuleRegistry();
export const globalModuleServiceRegistry = new InMemoryModuleServiceRegistry();
