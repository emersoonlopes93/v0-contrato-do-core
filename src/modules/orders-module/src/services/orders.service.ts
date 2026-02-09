import type { ModuleContext } from '@/src/core/modules/contracts';
import type { EventBus, DomainEvent } from '@/src/core/events/contracts';
import { asUUID } from '@/src/core/types';
import { globalRealtimeEmitter, REALTIME_ORDER_EVENTS } from '@/src/core';
import { OrdersRepository } from '../repositories/order.repository';
import { ORDERS_EVENTS } from '../events';
import type { OrderCreatedPayload, OrderStatusChangedPayload } from '../events';
import type {
  OrdersCreateOrderRequest,
  OrdersKanbanColumnDTO,
  OrdersKanbanDTO,
  OrdersOrderDTO,
  OrdersOrderSummaryDTO,
} from '@/src/types/orders';

export interface CreateOrderRequest {
  tenantId: string;
  userId: string | null;
  input: OrdersCreateOrderRequest;
}

export interface UpdateOrderStatusRequest {
  tenantId: string;
  orderId: string;
  userId: string | null;
  status: string;
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
      order,
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
      order: payload.order,
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

  async updateOrderDeliveryInfo(request: {
    tenantId: string;
    orderId: string;
    distanceKm: number | null;
    etaMinutes: number | null;
    deliveryFee: number | null;
  }): Promise<OrdersOrderDTO> {
    const updated = await this.repository.updateDeliveryInfo(request.tenantId, request.orderId, {
      distanceKm: request.distanceKm,
      etaMinutes: request.etaMinutes,
      deliveryFee: request.deliveryFee,
    });

    globalRealtimeEmitter.emitToTenant(request.tenantId, REALTIME_ORDER_EVENTS.ORDER_UPDATED, {
      orderId: updated.id,
      status: updated.status,
      order: updated,
    });

    return updated;
  }

  async getKanbanByTenant(tenantId: string): Promise<OrdersKanbanDTO> {
    const orders = await this.repository.listByTenant(tenantId);

    const columns: OrdersKanbanColumnDTO[] = [
      { key: 'created', title: 'Criado', orders: [] },
      { key: 'accepted', title: 'Aceito', orders: [] },
      { key: 'preparing', title: 'Preparando', orders: [] },
      { key: 'ready', title: 'Pronto', orders: [] },
      { key: 'completed', title: 'Concluído', orders: [] },
      { key: 'cancelled', title: 'Cancelado', orders: [] },
    ];

    const columnsByKey = new Map<string, OrdersKanbanColumnDTO>();
    for (const column of columns) {
      columnsByKey.set(column.key, column);
    }

    for (const order of orders) {
      const existingColumn = columnsByKey.get(order.status) ?? columnsByKey.get('created');
      if (existingColumn) {
        existingColumn.orders.push(order);
      }
    }

    for (const column of columns) {
      column.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return { columns };
  }

  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<OrdersOrderDTO> {
    const { tenantId, orderId, userId, status } = request;
    const systemUserId = '00000000-0000-0000-0000-000000000000';
    const effectiveUserId = userId ?? systemUserId;

    const order = await this.repository.updateStatus(tenantId, orderId, status, userId);

    const statusPayload: OrderStatusChangedPayload = {
      tenantId,
      userId: effectiveUserId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      timestamp: new Date(),
    };

    const statusEvent: DomainEvent = {
      id: `orders.status.changed:${order.id}:${Date.now()}`,
      type: ORDERS_EVENTS.ORDER_STATUS_CHANGED,
      tenantId: asUUID(tenantId),
      userId: asUUID(effectiveUserId),
      timestamp: statusPayload.timestamp,
      data: {
        tenantId: statusPayload.tenantId,
        userId: statusPayload.userId,
        orderId: statusPayload.orderId,
        orderNumber: statusPayload.orderNumber,
        status: statusPayload.status,
        timestamp: statusPayload.timestamp.toISOString(),
        order,
      },
    };

    await this.eventBus.publish(statusEvent);

    globalRealtimeEmitter.emitToTenant(tenantId, REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: order.id,
      status: order.status,
      userId: effectiveUserId,
    });

    globalRealtimeEmitter.emitToTenant(tenantId, REALTIME_ORDER_EVENTS.ORDER_UPDATED, {
      orderId: order.id,
      status: order.status,
      order,
    });

    if (order.status === 'cancelled') {
      globalRealtimeEmitter.emitToTenant(tenantId, REALTIME_ORDER_EVENTS.ORDER_CANCELLED, {
        orderId: order.id,
        status: order.status,
        order,
      });
    }

    return order;
  }
}
