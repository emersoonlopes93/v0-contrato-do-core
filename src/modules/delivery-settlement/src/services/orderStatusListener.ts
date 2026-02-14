import type { OrdersOrderDTO } from '@/src/types/orders';
import { DeliverySettlementService } from './deliverySettlementService';

export class OrderStatusListener {
  private readonly service = new DeliverySettlementService();

  async onOrderStatusChanged(order: OrdersOrderDTO, tenantId: string): Promise<void> {
    const completedStatuses = ['completed', 'delivered'];
    
    if (!completedStatuses.includes(order.status)) {
      return;
    }

    if (!order.deliveryFee || !order.distanceKm) {
      console.warn(`Order ${order.id} missing delivery data for settlement`);
      return;
    }

    try {
      await this.service.processOrderSettlement(
        tenantId,
        order.id,
        order.distanceKm,
        order.deliveryFee,
      );
      
      console.log(`Settlement processed for order ${order.id}`);
    } catch (error) {
      console.error(`Failed to process settlement for order ${order.id}:`, error);
    }
  }
}

export const orderStatusListener = new OrderStatusListener();
