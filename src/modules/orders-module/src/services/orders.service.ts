import type { ModuleContext } from '@/src/core/modules/contracts';
import type { EventBus, DomainEvent } from '@/src/core/events/contracts';
import { asUUID } from '@/src/core/types';
import { globalRealtimeEmitter, REALTIME_ORDER_EVENTS } from '@/src/core';
import { OrdersRepository } from '../repositories/order.repository';
import { ORDERS_EVENTS } from '../events';
import type { OrderCreatedPayload } from '../events';
import type {
  OrdersCreateOrderRequest,
  OrdersOrderDTO,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';

export interface CreateOrderRequest {
  tenantId: string;
  userId: string | null;
  input: OrdersCreateOrderRequest;
}

export class OrdersService {
  private readonly repository: OrdersRepository;
  private readonly eventBus: EventBus;

  constructor(context: ModuleContext) {
    this.repository = new OrdersRepository();
    this.eventBus = context.eventBus;
  }

  async createOrder(request: CreateOrderRequest): Promise<OrdersOrderDTO> {
    const { tenantId, userId, input } = request;
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    const effectiveUserId = userId ?? systemUserId;

    const order = await this.repository.createOrder(tenantId, userId, input);

    const payload: OrderCreatedPayload = {
      tenantId,
      userId: effectiveUserId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      source: order.source,
      status: order.status,
      total: order.total,
      itemsCount: order.items.length,
      timestamp: new Date(),
    };

    const data: Record<string, unknown> = {
      tenantId: payload.tenantId,
      userId: payload.userId,
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      source: payload.source,
      status: payload.status,
      total: payload.total,
      itemsCount: payload.itemsCount,
      timestamp: payload.timestamp.toISOString(),
    };

    const event: DomainEvent = {
      id: `orders.created:${order.id}:${Date.now()}`,
      type: ORDERS_EVENTS.ORDER_CREATED,
      tenantId: asUUID(tenantId),
      userId: asUUID(effectiveUserId),
      timestamp: payload.timestamp,
      data,
    };

    await this.eventBus.publish(event);
    globalRealtimeEmitter.emitToTenant(
      tenantId,
      REALTIME_ORDER_EVENTS.ORDER_CREATED,
      { orderId: order.id, orderNumber: order.orderNumber, order },
      event.id,
    );
    return order;
  }

  async listOrdersByTenant(tenantId: string): Promise<OrdersOrderSummaryDTO[]> {
    return this.repository.listByTenant(tenantId);
  }

  async getOrderById(tenantId: string, orderId: string): Promise<OrdersOrderDTO | null> {
    return this.repository.findById(tenantId, orderId);
  }
}
