import type { IDatabaseAdapter } from '@/src/core/db/contracts';

export interface OrderRecord {
  tenantId: string;
  userId: string;
  orderId: string;
  totalAmount: number;
  items: number;
  createdAt: Date;
}

export class OrdersRepository {
  constructor(private readonly database: IDatabaseAdapter) {}

  async saveOrder(data: OrderRecord): Promise<void> {
    console.log('[OrdersModule] Saved order:', {
      tenant_id: data.tenantId,
      user_id: data.userId,
      order_id: data.orderId,
      total_amount: data.totalAmount,
      items: data.items,
      created_at: data.createdAt,
    });

    // Em produção, utilizaria this.database com tenant_id obrigatório
  }

  async findByTenant(tenantId: string): Promise<OrderRecord[]> {
    console.log('[OrdersModule] Finding orders for tenant:', tenantId);

    // Em produção, utilizaria this.database com tenant_id obrigatório
    return [];
  }
}
