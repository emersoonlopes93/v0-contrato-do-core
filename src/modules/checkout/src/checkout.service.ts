import type { ModuleContext } from '@/src/core/modules/contracts';
import { prisma } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';
import { globalRealtimeEmitter, REALTIME_CHECKOUT_EVENTS } from '@/src/core';
import type {
  CheckoutCreateOrderRequest,
  CheckoutOrderDTO,
  CheckoutPaymentMethod,
  CheckoutServiceContract,
} from '@/src/types/checkout';
import { CheckoutRepository, type CheckoutOrderItemRow, type CheckoutOrderRow } from './checkout.repository';

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isPaymentMethod(value: unknown): value is CheckoutPaymentMethod {
  return value === 'cash' || value === 'pix' || value === 'card';
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function nowInTenantTimezone(timezone: string): Date {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const get = (type: string): number => {
      const p = parts.find((x) => x.type === type)?.value;
      return p ? Number(p) : 0;
    };

    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  } catch {
    return now;
  }
}

function toOrderDTO(order: CheckoutOrderRow, items: CheckoutOrderItemRow[]): CheckoutOrderDTO {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status === 'confirmed' || order.status === 'cancelled' ? order.status : 'pending',
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    total: order.total,
    paymentMethod: isPaymentMethod(order.payment_method) ? order.payment_method : 'cash',
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
    },
    tenantTimezone: order.tenant_timezone,
    createdAt: order.created_at.toISOString(),
    updatedAt: order.updated_at.toISOString(),
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.total_price,
      snapshot: i.snapshot,
    })),
  };
}

export function parseCheckoutCreateOrderRequest(
  value: unknown,
): { data: CheckoutCreateOrderRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };

  const items = value.items;
  const subtotal = value.subtotal;
  const deliveryFee = value.deliveryFee;
  const total = value.total;
  const paymentMethod = value.paymentMethod;
  const customer = value.customer;

  if (!Array.isArray(items) || items.length === 0) return { error: 'items inválido' };
  if (!isNumber(subtotal)) return { error: 'subtotal inválido' };
  if (!isNumber(deliveryFee)) return { error: 'deliveryFee inválido' };
  if (!isNumber(total)) return { error: 'total inválido' };
  if (!isPaymentMethod(paymentMethod)) return { error: 'paymentMethod inválido' };
  if (!isRecord(customer)) return { error: 'customer inválido' };
  if (!isString(customer.name) || !nonEmpty(customer.name)) return { error: 'customer.name inválido' };
  if (!isString(customer.phone) || !nonEmpty(customer.phone)) return { error: 'customer.phone inválido' };

  const parsedItems: CheckoutCreateOrderRequest['items'] = [];
  for (const item of items) {
    if (!isRecord(item)) return { error: 'items inválido' };
    if (!isString(item.productId) || !nonEmpty(item.productId)) return { error: 'item.productId inválido' };
    if (!isNumber(item.quantity) || item.quantity <= 0) return { error: 'item.quantity inválido' };
    if (!isNumber(item.unitPrice)) return { error: 'item.unitPrice inválido' };
    if (!isNumber(item.totalPrice)) return { error: 'item.totalPrice inválido' };

    let parsedVariation: CheckoutCreateOrderRequest['items'][number]['variation'] = null;
    const variation = item.variation;
    if (variation !== undefined && variation !== null) {
      if (!isRecord(variation)) return { error: 'item.variation inválido' };
      if (!isString(variation.id) || !nonEmpty(variation.id)) return { error: 'item.variation.id inválido' };
      if (!isString(variation.name) || !nonEmpty(variation.name)) return { error: 'item.variation.name inválido' };
      if (!isNumber(variation.price)) return { error: 'item.variation.price inválido' };
      parsedVariation = { id: variation.id, name: variation.name, price: variation.price };
    }

    let parsedModifiers: CheckoutCreateOrderRequest['items'][number]['modifiers'] = undefined;
    const modifiers = item.modifiers;
    if (modifiers !== undefined) {
      if (!Array.isArray(modifiers)) return { error: 'item.modifiers inválido' };
      parsedModifiers = [];
      for (const m of modifiers) {
        if (!isRecord(m)) return { error: 'item.modifiers inválido' };
        if (!isString(m.id) || !nonEmpty(m.id)) return { error: 'modifier.id inválido' };
        if (!isString(m.name) || !nonEmpty(m.name)) return { error: 'modifier.name inválido' };
        if (!isNumber(m.priceDelta)) return { error: 'modifier.priceDelta inválido' };
        if (m.quantity !== undefined && (!isNumber(m.quantity) || m.quantity <= 0)) return { error: 'modifier.quantity inválido' };
        parsedModifiers.push({
          id: m.id,
          name: m.name,
          priceDelta: m.priceDelta,
          quantity: m.quantity === undefined ? undefined : m.quantity,
        });
      }
    }

    parsedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      variation: parsedVariation,
      modifiers: parsedModifiers,
    });
  }

  return {
    data: {
      items: parsedItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      customer: { name: customer.name, phone: customer.phone },
    },
  };
}

export class CheckoutService implements CheckoutServiceContract {
  private readonly repository: CheckoutRepository;

  constructor(context: ModuleContext) {
    void context;
    this.repository = new CheckoutRepository();
  }

  async createOrder(tenantId: string, input: CheckoutCreateOrderRequest): Promise<CheckoutOrderDTO> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });
    if (!tenant) throw new Error('Tenant not found');
    if (tenant.status !== 'active') throw new Error('Tenant is not active');

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenant_id: tenantId },
      select: { address_street: true, address_city: true, address_state: true, timezone: true },
    });
    if (!tenantSettings) throw new Error('Tenant settings missing');
    if (!tenantSettings.address_street || !nonEmpty(tenantSettings.address_street)) throw new Error('Tenant settings invalid');
    if (!tenantSettings.address_city || !nonEmpty(tenantSettings.address_city)) throw new Error('Tenant settings invalid');
    if (!tenantSettings.address_state || !nonEmpty(tenantSettings.address_state)) throw new Error('Tenant settings invalid');

    const tenantTimezone = tenantSettings.timezone && nonEmpty(tenantSettings.timezone) ? tenantSettings.timezone : 'UTC';

    const uniqueProductIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const existingProducts = await prisma.product.findMany({
      where: {
        tenant_id: tenantId,
        id: { in: uniqueProductIds },
        deleted_at: null,
      },
      select: { id: true },
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    for (const id of uniqueProductIds) {
      if (!existingIds.has(id)) {
        throw new Error('Product not found');
      }
    }

    const createdAt = nowInTenantTimezone(tenantTimezone);

    const created = await this.repository.createOrder({
      tenantId,
      createdAt,
      status: 'pending',
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      total: input.total,
      paymentMethod: input.paymentMethod,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      tenantTimezone,
      items: input.items.map((i) => {
        const snapshot: Prisma.InputJsonValue = {
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          variation: i.variation ?? null,
          modifiers: i.modifiers ?? [],
        };
        return {
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          snapshot,
        };
      }),
    });

    globalRealtimeEmitter.emitToTenant(
      tenantId,
      REALTIME_CHECKOUT_EVENTS.CHECKOUT_STARTED,
      {
        orderId: created.order.id,
        orderNumber: created.order.order_number,
        status: created.order.status,
        total: created.order.total,
      },
    );

    return toOrderDTO(created.order, created.items);
  }

  async getOrderById(tenantId: string, orderId: string): Promise<CheckoutOrderDTO | null> {
    const found = await this.repository.findOrderById(tenantId, orderId);
    if (!found) return null;
    return toOrderDTO(found.order, found.items);
  }
}
