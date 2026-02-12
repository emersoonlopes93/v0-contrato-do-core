import type { DomainEvent, EventBus, EventHandler } from '@/src/core/events/contracts';
import { ORDERS_EVENTS } from '@/src/modules/orders-module/src/events';
import type { OrdersOrderDTO } from '@/src/types/orders';
import { ORDERS_OPERATIONAL_STATUS } from '@/src/types/orders';
import type { PrintOrderSnapshot, PrintJobPayload } from '@/src/types/printing';
import type { PrintingService } from './printing.service';

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOrderDTO(value: unknown): value is OrdersOrderDTO {
  if (!isRecord(value)) return false;
  if (!isString(value.id)) return false;
  if (!isNumber(value.orderNumber)) return false;
  if (!isString(value.source)) return false;
  if (!isString(value.status)) return false;
  if (!isNumber(value.total)) return false;
  if (!isString(value.createdAt)) return false;
  if (!('items' in value) || !Array.isArray(value.items)) return false;
  return true;
}

function toOrderSnapshot(order: OrdersOrderDTO): PrintOrderSnapshot {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes,
      modifiers: item.modifiers.map((modifier) => ({
        name: modifier.name,
        optionName: null,
        priceDelta: modifier.priceDelta,
      })),
    })),
  };
}

function buildPayload(order: OrdersOrderDTO): PrintJobPayload {
  return {
    order: toOrderSnapshot(order),
    source: order.source ?? null,
  };
}

export class PrintingListener implements EventHandler {
  constructor(
    private readonly eventBus: EventBus,
    private readonly printingService: PrintingService,
  ) {}

  register(): void {
    this.eventBus.subscribe(ORDERS_EVENTS.ORDER_CREATED, this);
    this.eventBus.subscribe(ORDERS_EVENTS.ORDER_STATUS_CHANGED, this);
  }

  async handle(event: DomainEvent): Promise<void> {
    if (!isRecord(event.data)) return;
    const tenantId = event.tenantId;
    if (!tenantId) return;

    if (event.type === ORDERS_EVENTS.ORDER_CREATED) {
      const order = event.data.order;
      if (!isOrderDTO(order)) return;
      await this.printingService.queueKitchenPrint(tenantId, buildPayload(order));
      return;
    }

    if (event.type === ORDERS_EVENTS.ORDER_STATUS_CHANGED) {
      const order = event.data.order;
      if (!isOrderDTO(order)) return;
      if (order.status !== ORDERS_OPERATIONAL_STATUS.COMPLETED) return;
      await this.printingService.queueCashierReceipt(tenantId, buildPayload(order));
    }
  }
}
