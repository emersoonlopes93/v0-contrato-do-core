/**
 * Tenant Middleware - Filtro automático por tenant_id
 * 
 * Aplica filtros automáticos em queries para isolar dados por tenant.
 */

import type { Prisma } from '@prisma/client';
import type { ITenantContext } from '../../core/db/contracts';

// Tabelas que possuem tenant_id
const TENANT_TABLES = [
  'TenantUser',
  'TenantModule',
  'Role',
  'UserRole',
  'WhiteBrandConfig',
  'AuditEvent',
  'TenantSubscription',
];

export function createTenantMiddleware(context: ITenantContext | null) {
  return async (params: any, next: any) => {
    // Se não há contexto, prossegue sem filtro
    if (!context?.tenantId) {
      return next(params);
    }

    // Se a tabela não possui tenant_id, prossegue sem filtro
    if (!TENANT_TABLES.includes(params.model)) {
      return next(params);
    }

    // Aplica filtro automático por tenant_id
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        tenant_id: context.tenantId,
      };
    }

    if (params.action === 'findMany') {
      params.args.where = {
        ...params.args.where,
        tenant_id: context.tenantId,
      };
    }

    if (params.action === 'create' || params.action === 'createMany') {
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          tenant_id: context.tenantId,
        };
      } else {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          tenant_id: context.tenantId,
        }));
      }
    }

    if (params.action === 'update' || params.action === 'updateMany') {
      params.args.where = {
        ...params.args.where,
        tenant_id: context.tenantId,
      };
    }

    if (params.action === 'delete' || params.action === 'deleteMany') {
      params.args.where = {
        ...params.args.where,
        tenant_id: context.tenantId,
      };
    }

    return next(params);
  };
}
