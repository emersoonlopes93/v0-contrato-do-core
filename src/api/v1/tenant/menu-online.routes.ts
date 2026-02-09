import {
  errorHandler,
  requireModule,
  requirePermission,
  requireTenantAuth,
  requestLogger,
  type AuthenticatedRequest,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { prisma } from '@/src/adapters/prisma/client';
import { tenantModuleService } from '@/src/adapters/prisma/modules/tenant-module.service';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId, asUUID } from '@/src/core/types';
import type { MenuOnlineService } from '@/src/modules/menu-online/src/services/menu-online.service';
import type {
  MenuOnlineAvailabilityWindow,
  MenuOnlineCreateCategoryRequest,
  MenuOnlineCreateComboRequest,
  MenuOnlineCreateCouponRequest,
  MenuOnlineCreateModifierGroupRequest,
  MenuOnlineCreateModifierOptionRequest,
  MenuOnlineCreateProductRequest,
  MenuOnlineCreateUpsellSuggestionRequest,
  MenuOnlineCheckoutRequest,
  MenuOnlineUpdateUpsellSuggestionRequest,
  MenuOnlineUpdateLoyaltyConfigRequest,
  MenuOnlineUpdateCashbackConfigRequest,
  MenuOnlinePriceSimulationRequest,
  MenuOnlinePublicMenuDTO,
  MenuOnlineUpdateCategoryRequest,
  MenuOnlineUpdateComboRequest,
  MenuOnlineUpdateCouponRequest,
  MenuOnlineUpdateModifierGroupRequest,
  MenuOnlineUpdateModifierOptionRequest,
  MenuOnlineUpdateProductRequest,
  MenuOnlineUpdateSettingsRequest,
} from '@/src/types/menu-online';
import type { OrdersCreateOrderRequest, OrdersServiceContract } from '@/src/types/orders';
import { getOrCreateTrackingToken } from '@/src/modules/client-tracking/src/services/clientTrackingTokenService';
import type { StoreSettingsServiceContract } from '@/src/types/store-settings';

const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHECKOUT_RATE_LIMIT_MAX = 8;
const checkoutRateLimit = new Map<string, { count: number; resetAt: number }>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function getAuthOrFail(req: Request, res: Response): { tenantId: string; userId: string } | null {
  const authReq = req as AuthenticatedRequest;
  const auth = authReq.auth;
  if (!auth?.tenantId || !auth.userId) {
    res.status = 401;
    res.body = { error: 'Unauthorized', message: 'Authentication context is missing' };
    return null;
  }
  return { tenantId: auth.tenantId, userId: auth.userId };
}

function getMenuOnlineService(): MenuOnlineService | null {
  return globalModuleServiceRegistry.get<MenuOnlineService>(
    asModuleId('menu-online'),
    'MenuOnlineService',
  );
}

function getOrdersService(): OrdersServiceContract | null {
  return globalModuleServiceRegistry.get<OrdersServiceContract>(
    asModuleId('orders-module'),
    'OrdersService',
  );
}

function getStoreSettingsService(): StoreSettingsServiceContract | null {
  return globalModuleServiceRegistry.get<StoreSettingsServiceContract>(
    asModuleId('store-settings'),
    'StoreSettingsService',
  );
}

function isOrdersCreateOrderRequest(value: unknown): value is OrdersCreateOrderRequest {
  if (!isRecord(value)) return false;

  const status = value.status;
  const total = value.total;
  const paymentMethod = value.paymentMethod;
  const customerName = value.customerName;
  const customerPhone = value.customerPhone;
  const deliveryType = value.deliveryType;
  const items = value.items;

  if (status !== undefined && !isString(status)) return false;
  if (!isNumber(total)) return false;

  if (paymentMethod !== undefined && paymentMethod !== null && !isString(paymentMethod)) return false;
  if (customerName !== undefined && customerName !== null && !isString(customerName)) return false;
  if (customerPhone !== undefined && customerPhone !== null && !isString(customerPhone)) return false;
  if (deliveryType !== undefined && deliveryType !== null && !isString(deliveryType)) return false;

  if (!Array.isArray(items)) return false;

  for (const item of items) {
    if (!isRecord(item)) return false;
    if (!isString(item.name)) return false;
    if (!isNumber(item.quantity)) return false;
    if (!isNumber(item.unitPrice)) return false;
    if (!isNumber(item.totalPrice)) return false;
    if (item.notes !== undefined && item.notes !== null && !isString(item.notes)) return false;

    if (item.modifiers !== undefined) {
      if (!Array.isArray(item.modifiers)) return false;
      for (const mod of item.modifiers) {
        if (!isRecord(mod)) return false;
        if (!isString(mod.name)) return false;
        if (mod.priceDelta !== undefined && !isNumber(mod.priceDelta)) return false;
      }
    }
  }

  return true;
}

function parseAvailability(value: unknown): MenuOnlineAvailabilityWindow[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return undefined;

  const result: MenuOnlineAvailabilityWindow[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const days = item.days;
    const start = item.start;
    const end = item.end;
    if (!Array.isArray(days) || typeof start !== 'string' || typeof end !== 'string') continue;
    const normalizedDays = days.filter((d): d is number => typeof d === 'number' && Number.isInteger(d));
    result.push({ days: normalizedDays, start, end });
  }

  return result;
}

function parseStatus(value: unknown): 'active' | 'inactive' | undefined {
  if (value === undefined) return undefined;
  if (value === 'active' || value === 'inactive') return value;
  return undefined;
}

function parseCreateCategory(body: unknown): { data: MenuOnlineCreateCategoryRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  if (typeof name !== 'string' || name.trim() === '') return { error: 'Field "name" é obrigatório' };

  const description = body.description;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);
  const availability = parseAvailability(body.availability);
  const visibleDelivery = body.visibleDelivery;
  const visibleCounter = body.visibleCounter;
  const visibleTable = body.visibleTable;

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return { error: 'Field "description" deve ser string ou null' };
  }
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) {
    return { error: 'Field "sortOrder" deve ser number' };
  }
  if (body.status !== undefined && status === undefined) {
    return { error: 'Field "status" deve ser "active" ou "inactive"' };
  }
  if (body.availability !== undefined && availability === undefined) {
    return { error: 'Field "availability" deve ser array ou null' };
  }
  if (visibleDelivery !== undefined && typeof visibleDelivery !== 'boolean') {
    return { error: 'Field "visibleDelivery" deve ser boolean' };
  }
  if (visibleCounter !== undefined && typeof visibleCounter !== 'boolean') {
    return { error: 'Field "visibleCounter" deve ser boolean' };
  }
  if (visibleTable !== undefined && typeof visibleTable !== 'boolean') {
    return { error: 'Field "visibleTable" deve ser boolean' };
  }

  return {
    data: {
      name: name.trim(),
      description: description === undefined ? undefined : description,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
      availability,
      visibleDelivery: visibleDelivery === undefined ? undefined : visibleDelivery,
      visibleCounter: visibleCounter === undefined ? undefined : visibleCounter,
      visibleTable: visibleTable === undefined ? undefined : visibleTable,
    },
  };
}

function parseUpdateCategory(body: unknown): { data: MenuOnlineUpdateCategoryRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };

  const name = body.name;
  const description = body.description;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);
  const availability = parseAvailability(body.availability);
  const visibleDelivery = body.visibleDelivery;
  const visibleCounter = body.visibleCounter;
  const visibleTable = body.visibleTable;

  if (name !== undefined && typeof name !== 'string') return { error: 'Field "name" deve ser string' };
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return { error: 'Field "description" deve ser string ou null' };
  }
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) {
    return { error: 'Field "sortOrder" deve ser number' };
  }
  if (body.status !== undefined && status === undefined) {
    return { error: 'Field "status" deve ser "active" ou "inactive"' };
  }
  if (body.availability !== undefined && availability === undefined) {
    return { error: 'Field "availability" deve ser array ou null' };
  }
  if (visibleDelivery !== undefined && typeof visibleDelivery !== 'boolean') {
    return { error: 'Field "visibleDelivery" deve ser boolean' };
  }
  if (visibleCounter !== undefined && typeof visibleCounter !== 'boolean') {
    return { error: 'Field "visibleCounter" deve ser boolean' };
  }
  if (visibleTable !== undefined && typeof visibleTable !== 'boolean') {
    return { error: 'Field "visibleTable" deve ser boolean' };
  }

  return {
    data: {
      name: name === undefined ? undefined : name.trim(),
      description: description === undefined ? undefined : description,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
      availability,
      visibleDelivery: visibleDelivery === undefined ? undefined : visibleDelivery,
      visibleCounter: visibleCounter === undefined ? undefined : visibleCounter,
      visibleTable: visibleTable === undefined ? undefined : visibleTable,
    },
  };
}

function parseCreateProduct(body: unknown): { data: MenuOnlineCreateProductRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };

  const categoryId = body.categoryId;
  const name = body.name;
  if (typeof categoryId !== 'string' || categoryId.trim() === '') return { error: 'Field "categoryId" é obrigatório' };
  if (typeof name !== 'string' || name.trim() === '') return { error: 'Field "name" é obrigatório' };

  const sku = body.sku;
  const description = body.description;
  const status = parseStatus(body.status);
  const sortOrder = body.sortOrder;
  const basePrice = body.basePrice;
  const promoPrice = body.promoPrice;
  const promoStartsAt = body.promoStartsAt;
  const promoEndsAt = body.promoEndsAt;
  const modifierGroupIds = body.modifierGroupIds;
  const images = body.images;
  const priceVariations = body.priceVariations;

  if (sku !== undefined && sku !== null && typeof sku !== 'string') return { error: 'Field "sku" deve ser string ou null' };
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return { error: 'Field "description" deve ser string ou null' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (basePrice !== undefined && (typeof basePrice !== 'number' || Number.isNaN(basePrice))) return { error: 'Field "basePrice" deve ser number' };
  if (promoPrice !== undefined && promoPrice !== null && (typeof promoPrice !== 'number' || Number.isNaN(promoPrice))) {
    return { error: 'Field "promoPrice" deve ser number ou null' };
  }
  if (promoStartsAt !== undefined && promoStartsAt !== null && typeof promoStartsAt !== 'string') {
    return { error: 'Field "promoStartsAt" deve ser string ou null' };
  }
  if (promoEndsAt !== undefined && promoEndsAt !== null && typeof promoEndsAt !== 'string') {
    return { error: 'Field "promoEndsAt" deve ser string ou null' };
  }
  if (modifierGroupIds !== undefined && (!Array.isArray(modifierGroupIds) || modifierGroupIds.some((v) => typeof v !== 'string'))) {
    return { error: 'Field "modifierGroupIds" deve ser string[]' };
  }

  const normalizedImages: MenuOnlineCreateProductRequest['images'] | undefined = (() => {
    if (images === undefined) return undefined;
    if (!Array.isArray(images)) return undefined;
    const mapped = images
      .filter((img): img is Record<string, unknown> => isRecord(img))
      .map((img) => {
        const url = img.url;
        const altText = img.altText;
        const imgSortOrder = img.sortOrder;
        if (typeof url !== 'string' || url.trim() === '') return null;
        if (altText !== undefined && altText !== null && typeof altText !== 'string') return null;
        if (imgSortOrder !== undefined && (typeof imgSortOrder !== 'number' || Number.isNaN(imgSortOrder))) return null;
        return {
          url: url.trim(),
          altText: altText === undefined ? undefined : altText,
          sortOrder: imgSortOrder === undefined ? undefined : imgSortOrder,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return mapped;
  })();
  if (images !== undefined && normalizedImages === undefined) return { error: 'Field "images" inválido' };

  const normalizedVariations: MenuOnlineCreateProductRequest['priceVariations'] | undefined = (() => {
    if (priceVariations === undefined) return undefined;
    if (!Array.isArray(priceVariations)) return undefined;
    const mapped = priceVariations
      .filter((v): v is Record<string, unknown> => isRecord(v))
      .map((v) => {
        const varName = v.name;
        const price = v.price;
        const priceDelta = v.priceDelta;
        const isDefault = v.isDefault;
        const varSortOrder = v.sortOrder;
        const varStatus = parseStatus(v.status);
        if (typeof varName !== 'string' || varName.trim() === '') return null;
        if (typeof price !== 'number' || Number.isNaN(price)) return null;
        if (priceDelta !== undefined && priceDelta !== null && (typeof priceDelta !== 'number' || Number.isNaN(priceDelta))) return null;
        if (isDefault !== undefined && typeof isDefault !== 'boolean') return null;
        if (varSortOrder !== undefined && (typeof varSortOrder !== 'number' || Number.isNaN(varSortOrder))) return null;
        if (v.status !== undefined && varStatus === undefined) return null;

        return {
          name: varName.trim(),
          price,
          priceDelta: priceDelta === undefined || priceDelta === null ? undefined : priceDelta,
          isDefault: isDefault === undefined ? undefined : isDefault,
          sortOrder: varSortOrder === undefined ? undefined : varSortOrder,
          status: varStatus,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return mapped;
  })();
  if (priceVariations !== undefined && normalizedVariations === undefined) return { error: 'Field "priceVariations" inválido' };

  return {
    data: {
      categoryId: categoryId.trim(),
      sku: sku === undefined ? undefined : sku,
      name: name.trim(),
      description: description === undefined ? undefined : description,
      status,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      basePrice: basePrice === undefined ? undefined : basePrice,
      promoPrice: promoPrice === undefined ? undefined : promoPrice === null ? null : promoPrice,
      promoStartsAt: promoStartsAt === undefined ? undefined : promoStartsAt === null ? null : promoStartsAt,
      promoEndsAt: promoEndsAt === undefined ? undefined : promoEndsAt === null ? null : promoEndsAt,
      modifierGroupIds: modifierGroupIds === undefined ? undefined : modifierGroupIds,
      images: normalizedImages,
      priceVariations: normalizedVariations,
    },
  };
}

function parseUpdateProduct(body: unknown): { data: MenuOnlineUpdateProductRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };

  const categoryId = body.categoryId;
  const sku = body.sku;
  const name = body.name;
  const description = body.description;
  const status = parseStatus(body.status);
  const sortOrder = body.sortOrder;
  const basePrice = body.basePrice;
  const promoPrice = body.promoPrice;
  const promoStartsAt = body.promoStartsAt;
  const promoEndsAt = body.promoEndsAt;
  const modifierGroupIds = body.modifierGroupIds;
  const images = body.images;
  const priceVariations = body.priceVariations;

  if (categoryId !== undefined && typeof categoryId !== 'string') return { error: 'Field "categoryId" deve ser string' };
  if (sku !== undefined && sku !== null && typeof sku !== 'string') return { error: 'Field "sku" deve ser string ou null' };
  if (name !== undefined && typeof name !== 'string') return { error: 'Field "name" deve ser string' };
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return { error: 'Field "description" deve ser string ou null' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (basePrice !== undefined && (typeof basePrice !== 'number' || Number.isNaN(basePrice))) return { error: 'Field "basePrice" deve ser number' };
  if (promoPrice !== undefined && promoPrice !== null && (typeof promoPrice !== 'number' || Number.isNaN(promoPrice))) {
    return { error: 'Field "promoPrice" deve ser number ou null' };
  }
  if (promoStartsAt !== undefined && promoStartsAt !== null && typeof promoStartsAt !== 'string') {
    return { error: 'Field "promoStartsAt" deve ser string ou null' };
  }
  if (promoEndsAt !== undefined && promoEndsAt !== null && typeof promoEndsAt !== 'string') {
    return { error: 'Field "promoEndsAt" deve ser string ou null' };
  }
  if (modifierGroupIds !== undefined && (!Array.isArray(modifierGroupIds) || modifierGroupIds.some((v) => typeof v !== 'string'))) {
    return { error: 'Field "modifierGroupIds" deve ser string[]' };
  }

  const normalizedImages: MenuOnlineUpdateProductRequest['images'] | undefined = (() => {
    if (images === undefined) return undefined;
    if (!Array.isArray(images)) return undefined;
    const mapped = images
      .filter((img): img is Record<string, unknown> => isRecord(img))
      .map((img) => {
        const id = img.id;
        const url = img.url;
        const altText = img.altText;
        const imgSortOrder = img.sortOrder;
        if (id !== undefined && typeof id !== 'string') return null;
        if (typeof url !== 'string' || url.trim() === '') return null;
        if (altText !== undefined && altText !== null && typeof altText !== 'string') return null;
        if (imgSortOrder !== undefined && (typeof imgSortOrder !== 'number' || Number.isNaN(imgSortOrder))) return null;
        return {
          id,
          url: url.trim(),
          altText: altText === undefined ? undefined : altText,
          sortOrder: imgSortOrder === undefined ? undefined : imgSortOrder,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return mapped;
  })();
  if (images !== undefined && normalizedImages === undefined) return { error: 'Field "images" inválido' };

  const normalizedVariations: MenuOnlineUpdateProductRequest['priceVariations'] | undefined = (() => {
    if (priceVariations === undefined) return undefined;
    if (!Array.isArray(priceVariations)) return undefined;
    const mapped = priceVariations
      .filter((v): v is Record<string, unknown> => isRecord(v))
      .map((v) => {
        const id = v.id;
        const varName = v.name;
        const price = v.price;
        const priceDelta = v.priceDelta;
        const isDefault = v.isDefault;
        const varSortOrder = v.sortOrder;
        const varStatus = parseStatus(v.status);
        if (id !== undefined && typeof id !== 'string') return null;
        if (typeof varName !== 'string' || varName.trim() === '') return null;
        if (typeof price !== 'number' || Number.isNaN(price)) return null;
        if (priceDelta !== undefined && priceDelta !== null && (typeof priceDelta !== 'number' || Number.isNaN(priceDelta))) return null;
        if (isDefault !== undefined && typeof isDefault !== 'boolean') return null;
        if (varSortOrder !== undefined && (typeof varSortOrder !== 'number' || Number.isNaN(varSortOrder))) return null;
        if (v.status !== undefined && varStatus === undefined) return null;

        return {
          id,
          name: varName.trim(),
          price,
          priceDelta: priceDelta === undefined || priceDelta === null ? undefined : priceDelta,
          isDefault: isDefault === undefined ? undefined : isDefault,
          sortOrder: varSortOrder === undefined ? undefined : varSortOrder,
          status: varStatus,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    return mapped;
  })();
  if (priceVariations !== undefined && normalizedVariations === undefined) return { error: 'Field "priceVariations" inválido' };

  return {
    data: {
      categoryId: categoryId === undefined ? undefined : categoryId.trim(),
      sku: sku === undefined ? undefined : sku,
      name: name === undefined ? undefined : name.trim(),
      description: description === undefined ? undefined : description,
      status,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      basePrice: basePrice === undefined ? undefined : basePrice,
      promoPrice: promoPrice === undefined ? undefined : promoPrice === null ? null : promoPrice,
      promoStartsAt: promoStartsAt === undefined ? undefined : promoStartsAt === null ? null : promoStartsAt,
      promoEndsAt: promoEndsAt === undefined ? undefined : promoEndsAt === null ? null : promoEndsAt,
      modifierGroupIds: modifierGroupIds === undefined ? undefined : modifierGroupIds,
      images: normalizedImages,
      priceVariations: normalizedVariations,
    },
  };
}

function parseCreateModifierGroup(body: unknown): { data: MenuOnlineCreateModifierGroupRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  if (typeof name !== 'string' || name.trim() === '') return { error: 'Field "name" é obrigatório' };

  const description = body.description;
  const minSelect = body.minSelect;
  const maxSelect = body.maxSelect;
  const isRequired = body.isRequired;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);

  if (description !== undefined && description !== null && typeof description !== 'string') return { error: 'Field "description" inválido' };
  if (minSelect !== undefined && (typeof minSelect !== 'number' || Number.isNaN(minSelect))) return { error: 'Field "minSelect" deve ser number' };
  if (maxSelect !== undefined && (typeof maxSelect !== 'number' || Number.isNaN(maxSelect))) return { error: 'Field "maxSelect" deve ser number' };
  if (isRequired !== undefined && typeof isRequired !== 'boolean') return { error: 'Field "isRequired" deve ser boolean' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      name: name.trim(),
      description: description === undefined ? undefined : description,
      minSelect: minSelect === undefined ? undefined : minSelect,
      maxSelect: maxSelect === undefined ? undefined : maxSelect,
      isRequired: isRequired === undefined ? undefined : isRequired,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseUpdateModifierGroup(body: unknown): { data: MenuOnlineUpdateModifierGroupRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  const description = body.description;
  const minSelect = body.minSelect;
  const maxSelect = body.maxSelect;
  const isRequired = body.isRequired;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);

  if (name !== undefined && typeof name !== 'string') return { error: 'Field "name" deve ser string' };
  if (description !== undefined && description !== null && typeof description !== 'string') return { error: 'Field "description" inválido' };
  if (minSelect !== undefined && (typeof minSelect !== 'number' || Number.isNaN(minSelect))) return { error: 'Field "minSelect" deve ser number' };
  if (maxSelect !== undefined && (typeof maxSelect !== 'number' || Number.isNaN(maxSelect))) return { error: 'Field "maxSelect" deve ser number' };
  if (isRequired !== undefined && typeof isRequired !== 'boolean') return { error: 'Field "isRequired" deve ser boolean' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      name: name === undefined ? undefined : name.trim(),
      description: description === undefined ? undefined : description,
      minSelect: minSelect === undefined ? undefined : minSelect,
      maxSelect: maxSelect === undefined ? undefined : maxSelect,
      isRequired: isRequired === undefined ? undefined : isRequired,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseCreateModifierOption(body: unknown): { data: MenuOnlineCreateModifierOptionRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const groupId = body.groupId;
  const name = body.name;
  if (typeof groupId !== 'string' || groupId.trim() === '') return { error: 'Field "groupId" é obrigatório' };
  if (typeof name !== 'string' || name.trim() === '') return { error: 'Field "name" é obrigatório' };

  const priceDelta = body.priceDelta;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);

  if (priceDelta !== undefined && (typeof priceDelta !== 'number' || Number.isNaN(priceDelta))) return { error: 'Field "priceDelta" deve ser number' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      groupId: groupId.trim(),
      name: name.trim(),
      priceDelta: priceDelta === undefined ? undefined : priceDelta,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseUpdateModifierOption(body: unknown): { data: MenuOnlineUpdateModifierOptionRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  const priceDelta = body.priceDelta;
  const sortOrder = body.sortOrder;
  const status = parseStatus(body.status);

  if (name !== undefined && typeof name !== 'string') return { error: 'Field "name" deve ser string' };
  if (priceDelta !== undefined && (typeof priceDelta !== 'number' || Number.isNaN(priceDelta))) return { error: 'Field "priceDelta" deve ser number' };
  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "sortOrder" deve ser number' };
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      name: name === undefined ? undefined : name.trim(),
      priceDelta: priceDelta === undefined ? undefined : priceDelta,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseUpdateSettings(body: unknown): { data: MenuOnlineUpdateSettingsRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const currency = body.currency;
  const showOutOfStock = body.showOutOfStock;
  const showImages = body.showImages;

  if (currency !== undefined && typeof currency !== 'string') return { error: 'Field "currency" deve ser string' };
  if (showOutOfStock !== undefined && typeof showOutOfStock !== 'boolean') return { error: 'Field "showOutOfStock" deve ser boolean' };
  if (showImages !== undefined && typeof showImages !== 'boolean') return { error: 'Field "showImages" deve ser boolean' };

  return {
    data: {
      currency: currency === undefined ? undefined : currency,
      showOutOfStock: showOutOfStock === undefined ? undefined : showOutOfStock,
      showImages: showImages === undefined ? undefined : showImages,
    },
  };
}

function parseCouponType(value: unknown): 'percent' | 'fixed' | undefined {
  if (value === undefined) return undefined;
  if (value === 'percent' || value === 'fixed') return value;
  return undefined;
}

function parseComboPricingType(value: unknown): 'fixed_price' | 'discount_percent' | 'discount_amount' | undefined {
  if (value === undefined) return undefined;
  if (value === 'fixed_price' || value === 'discount_percent' || value === 'discount_amount') return value;
  return undefined;
}

function parseCreateCoupon(body: unknown): { data: MenuOnlineCreateCouponRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const code = body.code;
  const type = parseCouponType(body.type);
  const value = body.value;

  if (typeof code !== 'string' || code.trim() === '') return { error: 'Field "code" é obrigatório' };
  if (body.type !== undefined && type === undefined) return { error: 'Field "type" deve ser "percent" ou "fixed"' };
  if (typeof value !== 'number' || Number.isNaN(value)) return { error: 'Field "value" é obrigatório e deve ser number' };

  const startsAt = body.startsAt;
  const endsAt = body.endsAt;
  const maxUsesTotal = body.maxUsesTotal;
  const maxUsesPerCustomer = body.maxUsesPerCustomer;
  const status = parseStatus(body.status);

  if (startsAt !== undefined && startsAt !== null && typeof startsAt !== 'string') return { error: 'Field "startsAt" deve ser string ou null' };
  if (endsAt !== undefined && endsAt !== null && typeof endsAt !== 'string') return { error: 'Field "endsAt" deve ser string ou null' };
  if (maxUsesTotal !== undefined && maxUsesTotal !== null && (typeof maxUsesTotal !== 'number' || !Number.isInteger(maxUsesTotal))) {
    return { error: 'Field "maxUsesTotal" deve ser int ou null' };
  }
  if (
    maxUsesPerCustomer !== undefined &&
    maxUsesPerCustomer !== null &&
    (typeof maxUsesPerCustomer !== 'number' || !Number.isInteger(maxUsesPerCustomer))
  ) {
    return { error: 'Field "maxUsesPerCustomer" deve ser int ou null' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      code: code.trim(),
      type: type ?? 'percent',
      value,
      startsAt: startsAt === undefined ? undefined : startsAt === null ? null : startsAt,
      endsAt: endsAt === undefined ? undefined : endsAt === null ? null : endsAt,
      maxUsesTotal: maxUsesTotal === undefined ? undefined : maxUsesTotal === null ? null : maxUsesTotal,
      maxUsesPerCustomer:
        maxUsesPerCustomer === undefined ? undefined : maxUsesPerCustomer === null ? null : maxUsesPerCustomer,
      status,
    },
  };
}

function parseUpdateCoupon(body: unknown): { data: MenuOnlineUpdateCouponRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const code = body.code;
  const type = parseCouponType(body.type);
  const value = body.value;
  const startsAt = body.startsAt;
  const endsAt = body.endsAt;
  const maxUsesTotal = body.maxUsesTotal;
  const maxUsesPerCustomer = body.maxUsesPerCustomer;
  const status = parseStatus(body.status);

  if (code !== undefined && typeof code !== 'string') return { error: 'Field "code" deve ser string' };
  if (body.type !== undefined && type === undefined) return { error: 'Field "type" deve ser "percent" ou "fixed"' };
  if (value !== undefined && (typeof value !== 'number' || Number.isNaN(value))) return { error: 'Field "value" deve ser number' };
  if (startsAt !== undefined && startsAt !== null && typeof startsAt !== 'string') return { error: 'Field "startsAt" deve ser string ou null' };
  if (endsAt !== undefined && endsAt !== null && typeof endsAt !== 'string') return { error: 'Field "endsAt" deve ser string ou null' };
  if (maxUsesTotal !== undefined && maxUsesTotal !== null && (typeof maxUsesTotal !== 'number' || !Number.isInteger(maxUsesTotal))) {
    return { error: 'Field "maxUsesTotal" deve ser int ou null' };
  }
  if (
    maxUsesPerCustomer !== undefined &&
    maxUsesPerCustomer !== null &&
    (typeof maxUsesPerCustomer !== 'number' || !Number.isInteger(maxUsesPerCustomer))
  ) {
    return { error: 'Field "maxUsesPerCustomer" deve ser int ou null' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  return {
    data: {
      code: code === undefined ? undefined : code.trim(),
      type,
      value,
      startsAt: startsAt === undefined ? undefined : startsAt === null ? null : startsAt,
      endsAt: endsAt === undefined ? undefined : endsAt === null ? null : endsAt,
      maxUsesTotal: maxUsesTotal === undefined ? undefined : maxUsesTotal === null ? null : maxUsesTotal,
      maxUsesPerCustomer:
        maxUsesPerCustomer === undefined ? undefined : maxUsesPerCustomer === null ? null : maxUsesPerCustomer,
      status,
    },
  };
}

function parseCreateCombo(body: unknown): { data: MenuOnlineCreateComboRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  const pricingType = parseComboPricingType(body.pricingType);
  const items = body.items;

  if (typeof name !== 'string' || name.trim() === '') return { error: 'Field "name" é obrigatório' };
  if (pricingType === undefined) return { error: 'Field "pricingType" é obrigatório' };
  if (!Array.isArray(items) || items.length === 0) return { error: 'Field "items" é obrigatório e deve ser array' };

  const description = body.description;
  const fixedPrice = body.fixedPrice;
  const discountPercent = body.discountPercent;
  const discountAmount = body.discountAmount;
  const status = parseStatus(body.status);

  if (description !== undefined && description !== null && typeof description !== 'string') return { error: 'Field "description" deve ser string ou null' };
  if (fixedPrice !== undefined && fixedPrice !== null && (typeof fixedPrice !== 'number' || Number.isNaN(fixedPrice))) {
    return { error: 'Field "fixedPrice" deve ser number ou null' };
  }
  if (
    discountPercent !== undefined &&
    discountPercent !== null &&
    (typeof discountPercent !== 'number' || Number.isNaN(discountPercent))
  ) {
    return { error: 'Field "discountPercent" deve ser number ou null' };
  }
  if (
    discountAmount !== undefined &&
    discountAmount !== null &&
    (typeof discountAmount !== 'number' || Number.isNaN(discountAmount))
  ) {
    return { error: 'Field "discountAmount" deve ser number ou null' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };

  const normalizedItems: MenuOnlineCreateComboRequest['items'] = [];
  for (const item of items) {
    if (!isRecord(item)) return { error: 'Field "items" inválido' };
    const productId = item.productId;
    if (typeof productId !== 'string' || productId.trim() === '') return { error: 'Field "items.productId" é obrigatório' };
    const minQty = item.minQty;
    const maxQty = item.maxQty;
    const sortOrder = item.sortOrder;
    const itemStatus = parseStatus(item.status);
    if (minQty !== undefined && (typeof minQty !== 'number' || !Number.isInteger(minQty))) return { error: 'Field "items.minQty" deve ser int' };
    if (maxQty !== undefined && (typeof maxQty !== 'number' || !Number.isInteger(maxQty))) return { error: 'Field "items.maxQty" deve ser int' };
    if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return { error: 'Field "items.sortOrder" deve ser number' };
    if (item.status !== undefined && itemStatus === undefined) return { error: 'Field "items.status" inválido' };
    normalizedItems.push({
      productId: productId.trim(),
      minQty: minQty === undefined ? undefined : minQty,
      maxQty: maxQty === undefined ? undefined : maxQty,
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status: itemStatus,
    });
  }

  return {
    data: {
      name: name.trim(),
      description: description === undefined ? undefined : description,
      pricingType,
      fixedPrice: fixedPrice === undefined ? undefined : fixedPrice === null ? null : fixedPrice,
      discountPercent: discountPercent === undefined ? undefined : discountPercent === null ? null : discountPercent,
      discountAmount: discountAmount === undefined ? undefined : discountAmount === null ? null : discountAmount,
      status,
      items: normalizedItems,
    },
  };
}

function parseUpdateCombo(body: unknown): { data: MenuOnlineUpdateComboRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const name = body.name;
  const description = body.description;
  const pricingType = parseComboPricingType(body.pricingType);
  const fixedPrice = body.fixedPrice;
  const discountPercent = body.discountPercent;
  const discountAmount = body.discountAmount;
  const status = parseStatus(body.status);
  const items = body.items;

  if (name !== undefined && typeof name !== 'string') return { error: 'Field "name" deve ser string' };
  if (description !== undefined && description !== null && typeof description !== 'string') return { error: 'Field "description" deve ser string ou null' };
  if (body.pricingType !== undefined && pricingType === undefined) return { error: 'Field "pricingType" inválido' };
  if (fixedPrice !== undefined && fixedPrice !== null && (typeof fixedPrice !== 'number' || Number.isNaN(fixedPrice))) return { error: 'Field "fixedPrice" inválido' };
  if (
    discountPercent !== undefined &&
    discountPercent !== null &&
    (typeof discountPercent !== 'number' || Number.isNaN(discountPercent))
  ) {
    return { error: 'Field "discountPercent" inválido' };
  }
  if (
    discountAmount !== undefined &&
    discountAmount !== null &&
    (typeof discountAmount !== 'number' || Number.isNaN(discountAmount))
  ) {
    return { error: 'Field "discountAmount" inválido' };
  }
  if (body.status !== undefined && status === undefined) return { error: 'Field "status" deve ser "active" ou "inactive"' };
  if (items !== undefined && !Array.isArray(items)) return { error: 'Field "items" deve ser array' };

  const normalizedItems: MenuOnlineUpdateComboRequest['items'] | undefined = (() => {
    if (items === undefined) return undefined;
    const result: Array<{
      id?: string;
      productId: string;
      minQty?: number;
      maxQty?: number;
      sortOrder?: number;
      status?: 'active' | 'inactive';
    }> = [];
    for (const item of items) {
      if (!isRecord(item)) return undefined;
      const id = item.id;
      const productId = item.productId;
      if (id !== undefined && typeof id !== 'string') return undefined;
      if (typeof productId !== 'string' || productId.trim() === '') return undefined;
      const minQty = item.minQty;
      const maxQty = item.maxQty;
      const sortOrder = item.sortOrder;
      const itemStatus = parseStatus(item.status);
      if (minQty !== undefined && (typeof minQty !== 'number' || !Number.isInteger(minQty))) return undefined;
      if (maxQty !== undefined && (typeof maxQty !== 'number' || !Number.isInteger(maxQty))) return undefined;
      if (sortOrder !== undefined && (typeof sortOrder !== 'number' || Number.isNaN(sortOrder))) return undefined;
      if (item.status !== undefined && itemStatus === undefined) return undefined;
      result.push({
        id,
        productId: productId.trim(),
        minQty: minQty === undefined ? undefined : minQty,
        maxQty: maxQty === undefined ? undefined : maxQty,
        sortOrder: sortOrder === undefined ? undefined : sortOrder,
        status: itemStatus,
      });
    }
    return result;
  })();
  if (items !== undefined && normalizedItems === undefined) return { error: 'Field "items" inválido' };

  return {
    data: {
      name: name === undefined ? undefined : name.trim(),
      description: description === undefined ? undefined : description,
      pricingType,
      fixedPrice: fixedPrice === undefined ? undefined : fixedPrice === null ? null : fixedPrice,
      discountPercent: discountPercent === undefined ? undefined : discountPercent === null ? null : discountPercent,
      discountAmount: discountAmount === undefined ? undefined : discountAmount === null ? null : discountAmount,
      status,
      items: normalizedItems,
    },
  };
}

function parsePriceSimulation(body: unknown): { data: MenuOnlinePriceSimulationRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const productId = body.productId;
  if (typeof productId !== 'string' || productId.trim() === '') return { error: 'Field "productId" é obrigatório' };
  const variationId = body.variationId;
  const modifierOptionIds = body.modifierOptionIds;
  const couponCode = body.couponCode;
  const customerKey = body.customerKey;

  if (variationId !== undefined && variationId !== null && typeof variationId !== 'string') return { error: 'Field "variationId" deve ser string ou null' };
  if (
    modifierOptionIds !== undefined &&
    (!Array.isArray(modifierOptionIds) || modifierOptionIds.some((v) => typeof v !== 'string'))
  ) {
    return { error: 'Field "modifierOptionIds" deve ser string[]' };
  }
  if (couponCode !== undefined && couponCode !== null && typeof couponCode !== 'string') return { error: 'Field "couponCode" deve ser string ou null' };
  if (customerKey !== undefined && customerKey !== null && typeof customerKey !== 'string') return { error: 'Field "customerKey" deve ser string ou null' };

  return {
    data: {
      productId: productId.trim(),
      variationId: variationId === undefined ? undefined : variationId === null ? null : variationId.trim(),
      modifierOptionIds: modifierOptionIds === undefined ? undefined : modifierOptionIds,
      couponCode: couponCode === undefined ? undefined : couponCode === null ? null : couponCode.trim(),
      customerKey: customerKey === undefined ? undefined : customerKey === null ? null : customerKey.trim(),
    },
  };
}

function parseValidateCoupon(body: unknown): { data: { couponCode: string; customerKey?: string | null } } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const couponCode = body.couponCode;
  const customerKey = body.customerKey;
  if (typeof couponCode !== 'string' || couponCode.trim() === '') return { error: 'Field "couponCode" é obrigatório' };
  if (customerKey !== undefined && customerKey !== null && typeof customerKey !== 'string') return { error: 'Field "customerKey" deve ser string ou null' };
  return {
    data: {
      couponCode: couponCode.trim(),
      customerKey: customerKey === undefined ? undefined : customerKey === null ? null : customerKey.trim(),
    },
  };
}

function parseCreateUpsellSuggestion(body: unknown): { data: MenuOnlineCreateUpsellSuggestionRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const fromProductId = body.fromProductId;
  const suggestedProductId = body.suggestedProductId;
  const sortOrder = body.sortOrder;
  const status = body.status;

  if (fromProductId !== undefined && fromProductId !== null && typeof fromProductId !== 'string') {
    return { error: 'Field "fromProductId" deve ser string ou null' };
  }
  if (typeof suggestedProductId !== 'string' || suggestedProductId.trim() === '') {
    return { error: 'Field "suggestedProductId" é obrigatório' };
  }
  if (sortOrder !== undefined && !isNumber(sortOrder)) return { error: 'Field "sortOrder" inválido' };
  if (status !== undefined && status !== 'active' && status !== 'inactive') return { error: 'Field "status" inválido' };

  return {
    data: {
      fromProductId: fromProductId === undefined ? undefined : fromProductId === null ? null : fromProductId.trim(),
      suggestedProductId: suggestedProductId.trim(),
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseUpdateUpsellSuggestion(body: unknown): { data: MenuOnlineUpdateUpsellSuggestionRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const fromProductId = body.fromProductId;
  const suggestedProductId = body.suggestedProductId;
  const sortOrder = body.sortOrder;
  const status = body.status;

  if (fromProductId !== undefined && fromProductId !== null && typeof fromProductId !== 'string') {
    return { error: 'Field "fromProductId" deve ser string ou null' };
  }
  if (suggestedProductId !== undefined && typeof suggestedProductId !== 'string') {
    return { error: 'Field "suggestedProductId" deve ser string' };
  }
  if (sortOrder !== undefined && !isNumber(sortOrder)) return { error: 'Field "sortOrder" inválido' };
  if (status !== undefined && status !== 'active' && status !== 'inactive') return { error: 'Field "status" inválido' };

  return {
    data: {
      fromProductId: fromProductId === undefined ? undefined : fromProductId === null ? null : fromProductId.trim(),
      suggestedProductId: suggestedProductId === undefined ? undefined : suggestedProductId.trim(),
      sortOrder: sortOrder === undefined ? undefined : sortOrder,
      status,
    },
  };
}

function parseUpdateLoyaltyConfig(body: unknown): { data: MenuOnlineUpdateLoyaltyConfigRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const enabled = body.enabled;
  const pointsPerCurrency = body.pointsPerCurrency;
  const currencyPerPoint = body.currencyPerPoint;

  if (enabled !== undefined && typeof enabled !== 'boolean') return { error: 'Field "enabled" inválido' };
  if (pointsPerCurrency !== undefined && !isNumber(pointsPerCurrency)) return { error: 'Field "pointsPerCurrency" inválido' };
  if (currencyPerPoint !== undefined && !isNumber(currencyPerPoint)) return { error: 'Field "currencyPerPoint" inválido' };

  return {
    data: {
      enabled: enabled === undefined ? undefined : enabled,
      pointsPerCurrency: pointsPerCurrency === undefined ? undefined : pointsPerCurrency,
      currencyPerPoint: currencyPerPoint === undefined ? undefined : currencyPerPoint,
    },
  };
}

function parseUpdateCashbackConfig(body: unknown): { data: MenuOnlineUpdateCashbackConfigRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const enabled = body.enabled;
  const percent = body.percent;
  const expiresDays = body.expiresDays;

  if (enabled !== undefined && typeof enabled !== 'boolean') return { error: 'Field "enabled" inválido' };
  if (percent !== undefined && !isNumber(percent)) return { error: 'Field "percent" inválido' };
  if (expiresDays !== undefined && expiresDays !== null && !isNumber(expiresDays)) return { error: 'Field "expiresDays" inválido' };

  return {
    data: {
      enabled: enabled === undefined ? undefined : enabled,
      percent: percent === undefined ? undefined : percent,
      expiresDays: expiresDays === undefined ? undefined : expiresDays === null ? null : expiresDays,
    },
  };
}

function parseUpdateCustomerBalance(body: unknown): { data: { loyaltyPoints?: number; cashbackBalance?: number } } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const loyaltyPoints = body.loyaltyPoints;
  const cashbackBalance = body.cashbackBalance;

  if (loyaltyPoints !== undefined && !isNumber(loyaltyPoints)) return { error: 'Field "loyaltyPoints" inválido' };
  if (cashbackBalance !== undefined && !isNumber(cashbackBalance)) return { error: 'Field "cashbackBalance" inválido' };

  return {
    data: {
      loyaltyPoints: loyaltyPoints === undefined ? undefined : loyaltyPoints,
      cashbackBalance: cashbackBalance === undefined ? undefined : cashbackBalance,
    },
  };
}

async function handleListCategories(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listCategories(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list categories' };
  }
}

async function handleCreateCategory(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateCategory(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createCategory(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

async function handleUpdateCategory(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const categoryId = req.params?.id;
  if (!categoryId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing category id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateCategory(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateCategory(auth.tenantId, categoryId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Category not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update category' };
  }
}

async function handleDeleteCategory(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const categoryId = req.params?.id;
  if (!categoryId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing category id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteCategory(auth.tenantId, categoryId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Category not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete category' };
  }
}

async function handleListProducts(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listProducts(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list products' };
  }
}

async function handleCreateProduct(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateProduct(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createProduct(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create product' };
  }
}

async function handleUpdateProduct(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const productId = req.params?.id;
  if (!productId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing product id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateProduct(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateProduct(auth.tenantId, productId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Product not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update product' };
  }
}

async function handleDeleteProduct(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const productId = req.params?.id;
  if (!productId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing product id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteProduct(auth.tenantId, productId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Product not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete product' };
  }
}

async function handleListModifierGroups(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listModifierGroups(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list modifier groups' };
  }
}

async function handleCreateModifierGroup(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateModifierGroup(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createModifierGroup(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create modifier group' };
  }
}

async function handleUpdateModifierGroup(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const groupId = req.params?.id;
  if (!groupId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing modifier group id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateModifierGroup(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateModifierGroup(auth.tenantId, groupId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Modifier group not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update modifier group' };
  }
}

async function handleDeleteModifierGroup(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const groupId = req.params?.id;
  if (!groupId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing modifier group id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteModifierGroup(auth.tenantId, groupId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Modifier group not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete modifier group' };
  }
}

async function handleListModifierOptions(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const groupId = req.params?.groupId;
  if (!groupId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing groupId' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listModifierOptions(auth.tenantId, groupId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list modifier options' };
  }
}

async function handleCreateModifierOption(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateModifierOption(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createModifierOption(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create modifier option' };
  }
}

async function handleUpdateModifierOption(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const optionId = req.params?.id;
  if (!optionId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing option id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateModifierOption(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateModifierOption(auth.tenantId, optionId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Modifier option not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update modifier option' };
  }
}

async function handleDeleteModifierOption(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const optionId = req.params?.id;
  if (!optionId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing option id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteModifierOption(auth.tenantId, optionId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Modifier option not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete modifier option' };
  }
}

async function handleGetSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.getSettings(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to get settings' };
  }
}

async function handleUpdateSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateSettings(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateSettings(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update settings' };
  }
}

async function handleListCombos(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listCombos(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list combos' };
  }
}

async function handleCreateCombo(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateCombo(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createCombo(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create combo' };
  }
}

async function handleUpdateCombo(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const comboId = req.params?.id;
  if (!comboId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing combo id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateCombo(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateCombo(auth.tenantId, comboId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Combo not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update combo' };
  }
}

async function handleDeleteCombo(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const comboId = req.params?.id;
  if (!comboId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing combo id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteCombo(auth.tenantId, comboId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Combo not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete combo' };
  }
}

async function handleListCoupons(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listCoupons(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list coupons' };
  }
}

async function handleCreateCoupon(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateCoupon(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createCoupon(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create coupon' };
  }
}

async function handleUpdateCoupon(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const couponId = req.params?.id;
  if (!couponId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing coupon id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateCoupon(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateCoupon(auth.tenantId, couponId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Coupon not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update coupon' };
  }
}

async function handleDeleteCoupon(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const couponId = req.params?.id;
  if (!couponId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing coupon id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteCoupon(auth.tenantId, couponId);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Coupon not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete coupon' };
  }
}

async function handleValidateCoupon(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseValidateCoupon(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const valid = await service.validateCoupon(auth.tenantId, parsed.data.couponCode, parsed.data.customerKey);
    res.status = 200;
    res.body = { success: true, data: { valid } };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to validate coupon' };
  }
}

async function handleSimulatePrice(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parsePriceSimulation(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.simulatePrice(auth.tenantId, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Product not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_MODIFIER_SELECTION' || error.message === 'INVALID_VARIATION')) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Seleção inválida' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to simulate price' };
  }
}

async function handleListUpsellSuggestions(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.listUpsellSuggestions(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list upsell' };
  }
}

async function handleCreateUpsellSuggestion(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseCreateUpsellSuggestion(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createUpsellSuggestion(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_UPSELL_SUGGESTION') {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Sugestão inválida' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to create upsell' };
  }
}

async function handleUpdateUpsellSuggestion(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing upsell id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateUpsellSuggestion(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateUpsellSuggestion(auth.tenantId, id, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Upsell not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update upsell' };
  }
}

async function handleDeleteUpsellSuggestion(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing upsell id' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const ok = await service.deleteUpsellSuggestion(auth.tenantId, id);
    if (!ok) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Upsell not found' };
      return;
    }
    res.status = 204;
    res.body = { success: true };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to delete upsell' };
  }
}

async function handleGetLoyaltyConfig(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.getLoyaltyConfig(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to get loyalty config' };
  }
}

async function handleUpdateLoyaltyConfig(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateLoyaltyConfig(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateLoyaltyConfig(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_LOYALTY_CONFIG') {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Configuração inválida' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update loyalty config' };
  }
}

async function handleGetCashbackConfig(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.getCashbackConfig(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to get cashback config' };
  }
}

async function handleUpdateCashbackConfig(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateCashbackConfig(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateCashbackConfig(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CASHBACK_CONFIG') {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Configuração inválida' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update cashback config' };
  }
}

async function handleGetCustomerBalance(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const customerKey = req.params?.customerKey?.trim() ?? '';
  if (!customerKey) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing customerKey' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const data = await service.getCustomerBalance(auth.tenantId, customerKey);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to get customer balance' };
  }
}

async function handleUpdateCustomerBalance(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const customerKey = req.params?.customerKey?.trim() ?? '';
  if (!customerKey) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing customerKey' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseUpdateCustomerBalance(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateCustomerBalance(auth.tenantId, customerKey, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CUSTOMER_BALANCE') {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Saldo inválido' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update customer balance' };
  }
}

async function handlePublicValidateCoupon(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug;
  if (!tenantSlug) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing tenantSlug' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parseValidateCoupon(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });
    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Tenant not found' };
      return;
    }
    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'Tenant is not active' };
      return;
    }
    const enabled = await tenantModuleService.isEnabled(asUUID(tenant.id), asModuleId('menu-online'));
    if (!enabled) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Menu not available' };
      return;
    }

    const valid = await service.validateCoupon(tenant.id, parsed.data.couponCode, parsed.data.customerKey);
    res.status = 200;
    res.body = { success: true, data: { valid } };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to validate coupon' };
  }
}

async function handlePublicSimulatePrice(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug;
  if (!tenantSlug) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing tenantSlug' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  const parsed = parsePriceSimulation(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });
    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Tenant not found' };
      return;
    }
    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'Tenant is not active' };
      return;
    }
    const enabled = await tenantModuleService.isEnabled(asUUID(tenant.id), asModuleId('menu-online'));
    if (!enabled) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Menu not available' };
      return;
    }

    const data = await service.simulatePrice(tenant.id, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Product not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_MODIFIER_SELECTION' || error.message === 'INVALID_VARIATION')) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Seleção inválida' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to simulate price' };
  }
}

async function handlePublicGetOrder(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug;
  const code = req.params?.code;
  if (!tenantSlug || !code) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing tenantSlug or code' };
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });
    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Tenant not found' };
      return;
    }
    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'Tenant is not active' };
      return;
    }

    const order = await prisma.order.findFirst({
      where: { tenant_id: tenant.id, public_order_code: code },
      select: {
        id: true,
        public_order_code: true,
        status: true,
        order_number: true,
        items: {
          select: {
            name: true,
            quantity: true,
            total_price: true,
          },
        },
        subtotal: true,
        discount: true,
        total: true,
      },
    });
    if (!order) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Order not found' };
      return;
    }
    const tracking = await getOrCreateTrackingToken(tenant.id, order.id);
    const currency =
      (await prisma.menuSettings.findUnique({
        where: { tenant_id: tenant.id },
        select: { currency: true },
      }))?.currency ?? 'BRL';
    const data = {
      orderId: order.id,
      publicOrderCode: order.public_order_code ?? String(order.order_number),
      status: order.status === 'confirmed' || order.status === 'cancelled' ? order.status : 'pending',
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        total: i.total_price,
      })),
      totals: {
        subtotal: order.subtotal ?? order.total,
        discount: order.discount ?? 0,
        total: order.total,
        currency,
      },
      publicTrackingToken: tracking.token,
      trackingExpiresAt: tracking.expiresAt.toISOString(),
    };
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load order' };
  }
}

async function handleGetPublicMenu(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug;
  if (!tenantSlug) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing tenantSlug' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true, status: true },
    });

    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Tenant not found' };
      return;
    }

    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'Tenant is not active' };
      return;
    }

    const enabled = await tenantModuleService.isEnabled(asUUID(tenant.id), asModuleId('menu-online'));
    if (!enabled) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Menu not available' };
      return;
    }

    const storeSettingsService = getStoreSettingsService();
    if (!storeSettingsService) {
      res.status = 500;
      res.body = { error: 'Internal Server Error', message: 'Store Settings service not found' };
      return;
    }

    const storeSettingsComplete = await storeSettingsService.isComplete(tenant.id);
    if (!storeSettingsComplete) {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'StoreSettings incompleto' };
      return;
    }

    const tenantSettingsRow = await prisma.tenantSettings.findUnique({
      where: { tenant_id: tenant.id },
      select: {
        trade_name: true,
        address_street: true,
        address_number: true,
        address_complement: true,
        address_neighborhood: true,
        address_city: true,
        address_state: true,
        address_zip: true,
        latitude: true,
        longitude: true,
        is_open: true,
      },
    });

    const [settings, categories, products, modifierGroups, combos, upsellSuggestions, loyaltyConfig, cashbackConfig] = await Promise.all([
      service.getSettings(tenant.id),
      service.listCategories(tenant.id),
      service.listProducts(tenant.id),
      service.listModifierGroups(tenant.id),
      service.listCombos(tenant.id),
      service.listUpsellSuggestions(tenant.id),
      service.getLoyaltyConfig(tenant.id),
      service.getCashbackConfig(tenant.id),
    ]);

    const modifierOptionsNested = await Promise.all(
      modifierGroups.map((group) => service.listModifierOptions(tenant.id, group.id)),
    );
    const modifierOptions = modifierOptionsNested.flat();

    const data: MenuOnlinePublicMenuDTO = {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        tradeName: tenantSettingsRow?.trade_name ?? null,
        address: {
          street: tenantSettingsRow?.address_street ?? null,
          number: tenantSettingsRow?.address_number ?? null,
          complement: tenantSettingsRow?.address_complement ?? null,
          neighborhood: tenantSettingsRow?.address_neighborhood ?? null,
          city: tenantSettingsRow?.address_city ?? null,
          state: tenantSettingsRow?.address_state ?? null,
          zip: tenantSettingsRow?.address_zip ?? null,
          latitude: tenantSettingsRow?.latitude ?? null,
          longitude: tenantSettingsRow?.longitude ?? null,
        },
        isOpen: tenantSettingsRow?.is_open ?? false,
      },
      settings,
      categories,
      products,
      modifierGroups,
      modifierOptions,
      combos,
      upsellSuggestions,
      loyaltyConfig,
      cashbackConfig,
    };

    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load menu' };
  }
}

async function handlePublicCheckout(req: Request, res: Response): Promise<void> {
  const tenantSlug = req.params?.tenantSlug;
  if (!tenantSlug) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing tenantSlug' };
    return;
  }

  const rateKey = `public-checkout:${tenantSlug}`;
  const now = Date.now();
  const entry = checkoutRateLimit.get(rateKey);
  if (!entry || entry.resetAt <= now) {
    checkoutRateLimit.set(rateKey, { count: 1, resetAt: now + CHECKOUT_RATE_LIMIT_WINDOW_MS });
  } else {
    if (entry.count >= CHECKOUT_RATE_LIMIT_MAX) {
      res.status = 429;
      res.body = { error: 'Too Many Requests', message: 'Checkout rate limit exceeded' };
      return;
    }
    entry.count++;
    checkoutRateLimit.set(rateKey, entry);
  }

  const body = req.body;
  if (!isRecord(body) || !Array.isArray(body.items)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const service = getMenuOnlineService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Menu Online service not found' };
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, status: true },
    });

    if (!tenant) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Tenant not found' };
      return;
    }

    if (tenant.status !== 'active') {
      res.status = 403;
      res.body = { error: 'Forbidden', message: 'Tenant is not active' };
      return;
    }

    const enabled = await tenantModuleService.isEnabled(asUUID(tenant.id), asModuleId('menu-online'));
    if (!enabled) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Checkout not available' };
      return;
    }

    const deliveryTypeValue =
      body.deliveryType === 'delivery' || body.deliveryType === 'pickup' || body.deliveryType === 'local'
        ? body.deliveryType
        : null;
    const paymentMethodValue =
      body.paymentMethod === 'cash' || body.paymentMethod === 'pix' || body.paymentMethod === 'card'
        ? body.paymentMethod
        : null;

    const input: MenuOnlineCheckoutRequest = {
      items: body.items,
      deliveryType: deliveryTypeValue,
      paymentMethod: paymentMethodValue,
      customerName: typeof body.customerName === 'string' ? body.customerName : null,
      customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : null,
      customerKey: typeof body.customerKey === 'string' ? body.customerKey : null,
      addressZip: typeof body.addressZip === 'string' ? body.addressZip : null,
      addressStreet: typeof body.addressStreet === 'string' ? body.addressStreet : null,
      addressNumber: typeof body.addressNumber === 'string' ? body.addressNumber : null,
      addressComplement: typeof body.addressComplement === 'string' ? body.addressComplement : null,
      addressNeighborhood: typeof body.addressNeighborhood === 'string' ? body.addressNeighborhood : null,
      addressCity: typeof body.addressCity === 'string' ? body.addressCity : null,
      addressState: typeof body.addressState === 'string' ? body.addressState : null,
      deliveryLatitude: isNumber(body.deliveryLatitude) ? body.deliveryLatitude : null,
      deliveryLongitude: isNumber(body.deliveryLongitude) ? body.deliveryLongitude : null,
    };

    if (!input.items || input.items.length === 0) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Carrinho vazio' };
      return;
    }

    const parsedItems = input.items.map((item) => ({
      productId: typeof item.productId === 'string' ? item.productId.trim() : '',
      quantity: typeof item.quantity === 'number' ? Math.max(1, Math.round(item.quantity)) : 0,
      variationId: typeof item.variationId === 'string' ? item.variationId : null,
      modifierOptionIds: Array.isArray(item.modifierOptionIds)
        ? item.modifierOptionIds.filter((id) => typeof id === 'string')
        : [],
      couponCode: typeof item.couponCode === 'string' ? item.couponCode.trim() : null,
    }));

    if (parsedItems.some((i) => !i.productId || i.quantity <= 0)) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Itens inválidos' };
      return;
    }

    const productIds = Array.from(new Set(parsedItems.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { tenant_id: tenant.id, id: { in: productIds }, deleted_at: null, status: 'active' },
      include: { priceVariations: true },
    });
    if (products.length !== productIds.length) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Produto inválido' };
      return;
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    const allOptionIds = Array.from(new Set(parsedItems.flatMap((i) => i.modifierOptionIds)));
    const optionRows = allOptionIds.length
      ? await prisma.modifierOption.findMany({
          where: { tenant_id: tenant.id, id: { in: allOptionIds }, deleted_at: null },
          include: { group: { select: { id: true, name: true, status: true, deleted_at: true } } },
        })
      : [];
    const optionMap = new Map(optionRows.map((o) => [o.id, o]));

    let subtotal = 0;
    let discount = 0;
    const itemsForOrder: OrdersCreateOrderRequest['items'] = [];

    for (const item of parsedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status = 400;
        res.body = { error: 'Bad Request', message: 'Produto inválido' };
        return;
      }
      const simulation = await service.simulatePrice(tenant.id, {
        productId: item.productId,
        variationId: item.variationId ?? undefined,
        modifierOptionIds: item.modifierOptionIds,
        couponCode: item.couponCode ?? undefined,
      });
      if (!simulation) {
        res.status = 400;
        res.body = { error: 'Bad Request', message: 'Produto inválido' };
        return;
      }

      const variationName = item.variationId
        ? product.priceVariations.find((v) => v.id === item.variationId)?.name ?? null
        : null;
      const displayName = variationName ? `${product.name} (${variationName})` : product.name;

      const modifiers = item.modifierOptionIds.map((id) => {
        const option = optionMap.get(id);
        if (!option || option.status !== 'active' || option.group?.deleted_at) {
          res.status = 400;
          res.body = { error: 'Bad Request', message: 'Complemento inválido' };
          throw new Error('INVALID_MODIFIER_SELECTION');
        }
        return {
          name: option.group?.name ?? 'Complemento',
          optionName: option.name,
          priceDelta: option.price_delta,
        };
      });

      itemsForOrder.push({
        productId: product.id,
        name: displayName,
        basePrice: product.base_price,
        quantity: item.quantity,
        unitPrice: simulation.total,
        totalPrice: simulation.total * item.quantity,
        notes: null,
        modifiers,
      });

      subtotal += simulation.subtotal * item.quantity;
      discount += simulation.discount * item.quantity;
    }

    let cashbackUsed = 0;
    if (input.customerKey) {
      const cashbackConfig = await service.getCashbackConfig(tenant.id);
      if (cashbackConfig.enabled) {
        const balance = await service.getCustomerBalance(tenant.id, input.customerKey);
        const available = balance.cashbackBalance;
        const maxUse = Math.max(0, subtotal - discount);
        cashbackUsed = Math.min(available, maxUse);
        if (cashbackUsed > 0) {
          await service.updateCustomerBalance(tenant.id, input.customerKey, {
            cashbackBalance: Math.max(0, available - cashbackUsed),
          });
        }
      }
    }

    const total = Math.max(0, subtotal - discount - cashbackUsed);

    const ordersService = getOrdersService();
    if (!ordersService) {
      res.status = 500;
      res.body = { error: 'Internal Server Error', message: 'Orders module service not found' };
      return;
    }

    const orderInput: OrdersCreateOrderRequest = {
      source: 'menu-online',
      status: 'pending',
      total,
      paymentMethod: input.paymentMethod ?? null,
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      deliveryType: input.deliveryType ?? null,
      customerAddress: {
        street: input.addressStreet ?? null,
        number: input.addressNumber ?? null,
        complement: input.addressComplement ?? null,
        neighborhood: input.addressNeighborhood ?? null,
        city: input.addressCity ?? null,
        state: input.addressState ?? null,
        zip: input.addressZip ?? null,
      },
      customerLatitude: input.deliveryLatitude ?? null,
      customerLongitude: input.deliveryLongitude ?? null,
      items: itemsForOrder,
    };

    const created = await ordersService.createOrder({
      tenantId: tenant.id,
      userId: null,
      input: orderInput,
    });

    const publicOrderCode = String(created.orderNumber);
    const tracking = await getOrCreateTrackingToken(tenant.id, created.id);

    const data = {
      orderId: created.id,
      publicOrderCode,
      status: created.status === 'confirmed' || created.status === 'cancelled' ? created.status : 'pending',
      publicTrackingToken: tracking.token,
      trackingExpiresAt: tracking.expiresAt.toISOString(),
    };
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    console.error('menu-online.checkout', {
      tenantSlug,
      error: error instanceof Error ? error.message : error,
    });
    if (error instanceof Error && (error.message === 'INVALID_MODIFIER_SELECTION' || error.message === 'INVALID_VARIATION' || error.message === 'PRODUCT_NOT_FOUND' || error.message === 'EMPTY_CART')) {
      res.status = 400;
      res.body = { error: 'Bad Request', message: 'Dados inválidos' };
      return;
    }
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to checkout' };
  }
}

async function handleCheckout(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;

  const body: unknown = req.body;
  if (!isOrdersCreateOrderRequest(body)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const ordersService = getOrdersService();
  if (!ordersService) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Orders module service not found' };
    return;
  }

  try {
    const input: OrdersCreateOrderRequest = { ...body, source: 'menu-online' };
    const created = await ordersService.createOrder({
      tenantId: auth.tenantId,
      userId: auth.userId,
      input,
    });

    res.status = 201;
    res.body = { success: true, data: created };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to checkout' };
  }
}

export const menuOnlinePublicRoutes: Route[] = [
  {
    method: 'GET',
    path: '/menu/:tenantSlug',
    middlewares: [requestLogger, errorHandler],
    handler: handleGetPublicMenu,
  },
  {
    method: 'POST',
    path: '/menu/:tenantSlug/price/simulate',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicSimulatePrice,
  },
  {
    method: 'POST',
    path: '/menu/:tenantSlug/coupons/validate',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicValidateCoupon,
  },
  {
    method: 'POST',
    path: '/menu/:tenantSlug/checkout',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicCheckout,
  },
  {
    method: 'GET',
    path: '/menu/:tenantSlug/order/:code',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicGetOrder,
  },
  {
    method: 'GET',
    path: '/api/v1/menu/:tenantSlug',
    middlewares: [requestLogger, errorHandler],
    handler: handleGetPublicMenu,
  },
  {
    method: 'POST',
    path: '/api/v1/menu/:tenantSlug/price/simulate',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicSimulatePrice,
  },
  {
    method: 'POST',
    path: '/api/v1/menu/:tenantSlug/coupons/validate',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicValidateCoupon,
  },
  {
    method: 'POST',
    path: '/api/v1/menu/:tenantSlug/checkout',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicCheckout,
  },
  {
    method: 'GET',
    path: '/api/v1/menu/:tenantSlug/order/:code',
    middlewares: [requestLogger, errorHandler],
    handler: handlePublicGetOrder,
  },
];

export const menuOnlineTenantRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/checkout',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('menu-online'),
      requireModule('orders-module'),
      requirePermission('orders.create'),
    ],
    handler: handleCheckout,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/categories',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListCategories,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/categories',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('categories.manage')],
    handler: handleCreateCategory,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/categories/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('categories.manage')],
    handler: handleUpdateCategory,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/categories/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('categories.manage')],
    handler: handleDeleteCategory,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/products',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListProducts,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/products',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('products.manage')],
    handler: handleCreateProduct,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/products/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('products.manage')],
    handler: handleUpdateProduct,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/products/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('products.manage')],
    handler: handleDeleteProduct,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/modifiers/groups',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListModifierGroups,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/modifiers/groups',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleCreateModifierGroup,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/modifiers/groups/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleUpdateModifierGroup,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/modifiers/groups/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleDeleteModifierGroup,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/modifiers/groups/:groupId/options',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListModifierOptions,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/modifiers/options',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleCreateModifierOption,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/modifiers/options/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleUpdateModifierOption,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/modifiers/options/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('modifiers.manage')],
    handler: handleDeleteModifierOption,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/settings',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleGetSettings,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/settings',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.manage')],
    handler: handleUpdateSettings,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/combos',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListCombos,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/combos',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleCreateCombo,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/combos/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateCombo,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/combos/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleDeleteCombo,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/coupons',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListCoupons,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/coupons',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleCreateCoupon,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/menu-online/coupons/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateCoupon,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/coupons/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleDeleteCoupon,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/coupons/validate',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleValidateCoupon,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/price/simulate',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleSimulatePrice,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/upsell-suggestions',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleListUpsellSuggestions,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/menu-online/upsell-suggestions',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleCreateUpsellSuggestion,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/menu-online/upsell-suggestions/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateUpsellSuggestion,
  },
  {
    method: 'DELETE',
    path: '/api/v1/tenant/menu-online/upsell-suggestions/:id',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleDeleteUpsellSuggestion,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/loyalty',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleGetLoyaltyConfig,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/menu-online/loyalty',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateLoyaltyConfig,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/cashback',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleGetCashbackConfig,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/menu-online/cashback',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateCashbackConfig,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/menu-online/customer-balances/:customerKey',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('menu.view')],
    handler: handleGetCustomerBalance,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/menu-online/customer-balances/:customerKey',
    middlewares: [requestLogger, errorHandler, requireTenantAuth, requireModule('menu-online'), requirePermission('pricing.manage')],
    handler: handleUpdateCustomerBalance,
  },
];
