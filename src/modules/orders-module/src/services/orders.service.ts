import type { ModuleContext } from '@/src/core/modules/contracts';
import type { EventBus, DomainEvent } from '@/src/core/events/contracts';
import type { TenantId, UserId } from '@/src/core/types';
import { OrdersRepository } from '../repositories/order.repository';
import { ORDERS_EVENTS } from '../events';
import type { OrderCreatedPayload } from '../events';

export interface CreateOrderRequest {
  tenantId: string;
  userId: string;
  orderId: string;
  totalAmount: number;
  items: number;
}

export class OrdersService {
  private readonly repository: OrdersRepository;
  private readonly eventBus: EventBus;

  constructor(context: ModuleContext) {
    this.repository = new OrdersRepository(context.database);
    this.eventBus = context.eventBus;
  }

  async createOrder(request: CreateOrderRequest): Promise<void> {
    const { tenantId, userId, orderId, totalAmount, items } = request;

    await this.repository.saveOrder({
      tenantId,
      userId,
      orderId,
      totalAmount,
      items,
      createdAt: new Date(),
    });

    const payload: OrderCreatedPayload = {
      tenantId,
      userId,
      orderId,
      totalAmount,
      items,
      timestamp: new Date(),
    };

    const event: DomainEvent = {
      id: `orders.created:${Date.now()}`,
      type: ORDERS_EVENTS.ORDER_CREATED,
      tenantId: tenantId as TenantId,
      userId: userId as UserId,
      timestamp: payload.timestamp,
      data: payload as unknown as Record<string, unknown>,
    };

    await this.eventBus.publish(event);
  }

  async listOrdersByTenant(tenantId: string): Promise<unknown[]> {
    return this.repository.findByTenant(tenantId);
  }
}
