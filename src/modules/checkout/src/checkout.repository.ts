import { prisma } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';

export type CheckoutOrderRow = Prisma.CheckoutOrderGetPayload<Prisma.CheckoutOrderDefaultArgs>;
export type CheckoutOrderItemRow = Prisma.CheckoutOrderItemGetPayload<Prisma.CheckoutOrderItemDefaultArgs>;

export class CheckoutRepository {
  async createOrder(input: {
    tenantId: string;
    createdAt: Date;
    status: 'pending' | 'confirmed' | 'cancelled';
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    tenantTimezone: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      snapshot: Prisma.InputJsonValue;
    }>;
  }): Promise<{ order: CheckoutOrderRow; items: CheckoutOrderItemRow[] }> {
    const {
      tenantId,
      createdAt,
      status,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      customerName,
      customerPhone,
      tenantTimezone,
      items,
    } = input;

    const result = await prisma.$transaction(async (tx) => {
      const last = await tx.checkoutOrder.findFirst({
        where: { tenant_id: tenantId },
        orderBy: { order_number: 'desc' },
        select: { order_number: true },
      });
      const orderNumber = (last?.order_number ?? 0) + 1;

      const order = await tx.checkoutOrder.create({
        data: {
          tenant_id: tenantId,
          order_number: orderNumber,
          status,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethod,
          customer_name: customerName,
          customer_phone: customerPhone,
          tenant_timezone: tenantTimezone,
          created_at: createdAt,
        },
      });

      await tx.checkoutOrderItem.createMany({
        data: items.map((i) => ({
          tenant_id: tenantId,
          order_id: order.id,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.totalPrice,
          snapshot: i.snapshot,
        })),
      });
      const createdItems = await tx.checkoutOrderItem.findMany({
        where: { order_id: order.id, tenant_id: tenantId },
        orderBy: { created_at: 'asc' },
      });

      return {
        order,
        items: createdItems,
      };
    });

    return result;
  }

  async findOrderById(tenantId: string, id: string): Promise<{ order: CheckoutOrderRow; items: CheckoutOrderItemRow[] } | null> {
    const order = await prisma.checkoutOrder.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!order) return null;

    const items = await prisma.checkoutOrderItem.findMany({
      where: { order_id: id, tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
    });

    return {
      order,
      items,
    };
  }
}
