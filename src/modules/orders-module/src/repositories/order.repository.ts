import { getPrismaClient } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';
import type { OrdersCreateOrderRequest, OrdersDeliveryInfoDTO, OrdersOrderDTO, OrdersOrderSummaryDTO } from '@/src/types/orders';

type OrderRow = Prisma.OrderGetPayload<{
  include: {
    items: { include: { modifiers: true } };
    timelineEvents: true;
  };
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function parseDeliveryInfo(value: unknown): OrdersDeliveryInfoDTO {
  if (!isRecord(value)) {
    return { distanceKm: null, etaMinutes: null, deliveryFee: null };
  }

  const distanceKm = isNumber(value.distanceKm) ? value.distanceKm : null;
  const etaMinutes = isNumber(value.etaMinutes) ? value.etaMinutes : null;
  const deliveryFee = isNumber(value.deliveryFee) ? value.deliveryFee : null;
  const customerLatitude = isNumber(value.customerLatitude) ? value.customerLatitude : null;
  const customerLongitude = isNumber(value.customerLongitude) ? value.customerLongitude : null;
  const driverLatitude = isNumber(value.driverLatitude) ? value.driverLatitude : null;
  const driverLongitude = isNumber(value.driverLongitude) ? value.driverLongitude : null;
  const driverUpdatedAt = isNullableString(value.driverUpdatedAt) ? value.driverUpdatedAt : null;

  return {
    distanceKm,
    etaMinutes,
    deliveryFee,
    customerLatitude,
    customerLongitude,
    driverLatitude,
    driverLongitude,
    driverUpdatedAt,
  };
}

function toOrderDTO(row: OrderRow): OrdersOrderDTO {
  const deliveryInfo = parseDeliveryInfo(row.delivery_info);
  return {
    id: row.id,
    orderNumber: row.order_number,
    source: row.source,
    status: row.status,
    total: row.total,
    paymentMethod: row.payment_method ?? null,
    customerName: row.customer_name ?? null,
    customerPhone: row.customer_phone ?? null,
    deliveryType: row.delivery_type ?? null,
    distanceKm: deliveryInfo.distanceKm,
    etaMinutes: deliveryInfo.etaMinutes,
    deliveryFee: deliveryInfo.deliveryFee,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    items: row.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.total_price,
      notes: i.notes ?? null,
      modifiers: i.modifiers.map((m) => ({
        id: m.id,
        name: m.name,
        priceDelta: m.price_delta,
      })),
    })),
    timelineEvents: row.timelineEvents
      .slice()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((e) => ({
        id: e.id,
        fromStatus: e.from_status ?? null,
        toStatus: e.to_status,
        userId: e.user_id ?? null,
        timestamp: e.timestamp.toISOString(),
      })),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === 'P2002';
}

export class OrdersRepository {
  private readonly prisma = getPrismaClient();

  async createOrder(
    tenantId: string,
    userId: string | null,
    input: OrdersCreateOrderRequest,
  ): Promise<OrdersOrderDTO> {
    const source = input.source ?? 'tenant';
    const status = input.status ?? 'created';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const last = await tx.order.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { order_number: 'desc' },
            select: { order_number: true },
          });

          const nextOrderNumber = (last?.order_number ?? 0) + 1;

          const row: OrderRow = await tx.order.create({
            data: {
              tenant_id: tenantId,
              order_number: nextOrderNumber,
              source,
              status,
              total: input.total,
              payment_method: input.paymentMethod ?? null,
              customer_name: input.customerName ?? null,
              customer_phone: input.customerPhone ?? null,
              delivery_type: input.deliveryType ?? null,
              delivery_info:
                typeof input.customerLatitude === 'number' &&
                typeof input.customerLongitude === 'number'
                  ? {
                      customerLatitude: input.customerLatitude,
                      customerLongitude: input.customerLongitude,
                    }
                  : undefined,
              items: {
                create: input.items.map((i) => ({
                  tenant_id: tenantId,
                  name: i.name,
                  quantity: i.quantity,
                  unit_price: i.unitPrice,
                  total_price: i.totalPrice,
                  notes: i.notes ?? null,
                  modifiers: {
                    create: (i.modifiers ?? []).map((m) => ({
                      tenant_id: tenantId,
                      name: m.name,
                      price_delta: m.priceDelta ?? 0,
                    })),
                  },
                })),
              },
              timelineEvents: {
                create: [
                  {
                    tenant_id: tenantId,
                    from_status: null,
                    to_status: status,
                    user_id: userId ?? null,
                  },
                ],
              },
            },
            include: {
              items: { include: { modifiers: true } },
              timelineEvents: true,
            },
          });

          return row;
        });

        return toOrderDTO(created);
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt < 2) {
          continue;
        }
        throw error;
      }
    }

    throw new Error('Falha ao criar pedido');
  }

  async listByTenant(tenantId: string): Promise<OrdersOrderSummaryDTO[]> {
    const rows = await this.prisma.order.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { items: true } } },
    });

    return rows.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      source: o.source,
      status: o.status,
      total: o.total,
      itemsCount: o._count.items,
      createdAt: o.created_at.toISOString(),
    }));
  }

  async findById(tenantId: string, orderId: string): Promise<OrdersOrderDTO | null> {
    const row = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        items: { include: { modifiers: true } },
        timelineEvents: true,
      },
    });

    if (!row) return null;
    return toOrderDTO(row);
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    nextStatus: string,
    userId: string | null,
  ): Promise<OrdersOrderDTO> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findFirst({
        where: { id: orderId, tenant_id: tenantId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existing) {
        throw new Error('Pedido não encontrado');
      }

      const row = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          timelineEvents: {
            create: {
              tenant_id: tenantId,
              from_status: existing.status,
              to_status: nextStatus,
              user_id: userId ?? null,
            },
          },
        },
        include: {
          items: { include: { modifiers: true } },
          timelineEvents: true,
        },
      });

      return row;
    });

    return toOrderDTO(updated);
  }

  async updateDeliveryInfo(
    tenantId: string,
    orderId: string,
    info: OrdersDeliveryInfoDTO,
  ): Promise<OrdersOrderDTO> {
    const current = await this.prisma.order.findFirst({
      where: { id: orderId, tenant_id: tenantId },
      select: { id: true, delivery_info: true },
    });
    if (!current) {
      throw new Error('Pedido não encontrado');
    }
    const existing = parseDeliveryInfo(current.delivery_info);
    const row = await this.prisma.order.update({
      where: { id: orderId, tenant_id: tenantId },
      data: {
        delivery_info: {
          distanceKm: info.distanceKm,
          etaMinutes: info.etaMinutes,
          deliveryFee: info.deliveryFee,
          customerLatitude: existing.customerLatitude ?? null,
          customerLongitude: existing.customerLongitude ?? null,
          driverLatitude: existing.driverLatitude ?? null,
          driverLongitude: existing.driverLongitude ?? null,
          driverUpdatedAt: existing.driverUpdatedAt ?? null,
        },
      },
      include: {
        items: { include: { modifiers: true } },
        timelineEvents: true,
      },
    });

    return toOrderDTO(row);
  }
}
