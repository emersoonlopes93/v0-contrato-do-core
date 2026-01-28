import type { TenantId, UserId, ModuleId, AuditEvent } from "../types/index";

export interface DomainEvent {
  id: string;
  type: string;
  tenantId?: TenantId;
  userId: UserId;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export interface EventBus {
  subscribe(eventType: string, handler: EventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
  publish(event: DomainEvent): Promise<void>;
  publishMultiple(events: DomainEvent[]): Promise<void>;
}

export interface AuditLogger {
  log(event: AuditEvent): Promise<void>;
  getEvents(tenantId?: TenantId, userId?: UserId, limit?: number): Promise<AuditEvent[]>;
  getEventsByAction(action: string, tenantId?: TenantId): Promise<AuditEvent[]>;
}

export enum CoreEvents {
  TENANT_CREATED = "core.tenant.created",
  TENANT_UPDATED = "core.tenant.updated",
  TENANT_DELETED = "core.tenant.deleted",
  TENANT_USER_CREATED = "core.tenant_user.created",
  TENANT_USER_UPDATED = "core.tenant_user.updated",
  TENANT_USER_DELETED = "core.tenant_user.deleted",
  PLAN_CHANGED = "core.plan.changed",
  MODULE_ACTIVATED = "core.module.activated",
  MODULE_DEACTIVATED = "core.module.deactivated",
  PERMISSION_GRANTED = "core.permission.granted",
  PERMISSION_REVOKED = "core.permission.revoked",
  SAAS_ADMIN_LOGIN = "core.saas_admin.login",
  TENANT_USER_LOGIN = "core.tenant_user.login",
}
