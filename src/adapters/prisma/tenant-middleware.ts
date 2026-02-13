/**
 * Tenant Middleware - Filtro automático por tenant_id
 * 
 * Aplica filtros automáticos em queries para isolar dados por tenant.
 */

import type { ITenantContext } from '../../core/db/contracts';

interface TenantMiddlewareParams {
  model?: string;
  action: string;
  args: {
    where?: Record<string, unknown>;
    data?: unknown;
  };
}

type TenantMiddlewareNext = (params: TenantMiddlewareParams) => Promise<unknown>;

// Tabelas que possuem tenant_id
export const TENANT_TABLES = [
  'TenantUser',
  'TenantModule',
  'Role',
  'UserRole',
  'WhiteBrandConfig',
  'AuditEvent',
  'TenantSubscription',
  'Category',
  'Product',
  'ProductImage',
  'PriceVariation',
  'ModifierGroup',
  'ModifierOption',
  'ProductModifier',
  'MenuSettings',
  'MenuUpsellSuggestion',
  'MenuCombo',
  'MenuComboItem',
  'MenuCoupon',
  'MenuCouponRedemption',
  'MenuLoyaltyConfig',
  'MenuCashbackConfig',
  'MenuCustomerBalance',
  'StoreSettings',
  'DeliveryPricingSettings',
  'Order',
  'OrderItem',
  'OrderItemModifier',
  'OrderTimelineEvent',
  'CheckoutOrder',
  'CheckoutOrderItem',
  'Payment',
  'DeliveryRoute',
  'DeliveryDriver',
  'DriverPosition',
  'DriverStatusHistory',
];

export function createTenantMiddleware(
  context: ITenantContext | null,
) {
  return async (params: TenantMiddlewareParams, next: TenantMiddlewareNext) => {
    // Se não há contexto, prossegue sem filtro
    if (!context?.tenantId) {
      return next(params);
    }

    // Se a tabela não possui tenant_id, prossegue sem filtro
    if (!params.model || !TENANT_TABLES.includes(params.model)) {
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
        if (params.args.data && typeof params.args.data === 'object') {
          const dataObject = params.args.data as Record<string, unknown>;
          params.args.data = {
            ...dataObject,
            tenant_id: context.tenantId,
          };
        }
      } else {
        const dataItems = params.args
          .data as Array<Record<string, unknown>>;
        params.args.data = dataItems.map((item) => ({
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
