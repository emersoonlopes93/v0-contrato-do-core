import type { ModuleId, TenantId } from "../types/index";
import type { IDatabaseAdapter } from "../db/contracts";
import type { EventBus } from "../events/contracts";

export interface ModuleRegisterPayload {
  id: ModuleId;
  name: string;
  description?: string;
  version: string;
  permissions: ModulePermission[];
  eventTypes: ModuleEventType[];
  requiredPlan?: string;
  uiEntry?: {
    tenantBasePath: string;
    homeLabel: string;
    icon: string;
    category: string;
  };
  type?: string;
  scope?: string;
  mobileFirst?: boolean;
  requiresAuth?: boolean;
  canDisable?: boolean;
}

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
}

export interface ModuleEventType {
  id: string;
  name: string;
  description: string;
}

export interface Module {
  register(): ModuleRegisterPayload;
  activate(tenantId: TenantId): Promise<void>;
  deactivate(tenantId: TenantId): Promise<void>;
  isActive(tenantId: TenantId): Promise<boolean>;
}

export interface ModuleRegistry {
  register(module: ModuleRegisterPayload): Promise<void>;
  getModuleDefinition(moduleId: ModuleId): Promise<ModuleRegisterPayload | null>;
  listRegisteredModules(): Promise<ModuleRegisterPayload[]>;
  listTenantActiveModules(tenantId: TenantId): Promise<ModuleRegisterPayload[]>;
  activateModuleForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<void>;
  deactivateModuleForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<void>;
  isModuleActiveForTenant(moduleId: ModuleId, tenantId: TenantId): Promise<boolean>;
}

export interface ModuleServiceRegistry {
  register<T>(moduleId: ModuleId, serviceKey: string, service: T): void;
  get<T>(moduleId: ModuleId, serviceKey: string): T | null;
}

export interface ModuleContext {
  database: IDatabaseAdapter;
  eventBus: EventBus;
  registerService<T>(moduleId: ModuleId, serviceKey: string, service: T): void;
}
