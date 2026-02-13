import { getPrismaClient } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';
import type { 
  DashboardDateRanges, 
  DashboardRepository, 
  RevenueMetrics, 
  OrderMetrics, 
  CustomerMetrics, 
  TopCustomer, 
  DeliveryPerformance 
} from '../../domain/repositories/dashboard.repository';

// Constants matching logical status for revenue
const REVENUE_STATUSES = ['completed', 'delivered'];
// Constants for valid orders (excluding cancelled)
const VALID_ORDER_STATUSES = ['created', 'accepted', 'preparing', 'ready', 'delivering', 'completed', 'delivered'];

export class PrismaDashboardRepository implements DashboardRepository {
  private get prisma() {
    return getPrismaClient();
  }

  async getRevenueMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<RevenueMetrics> {
    const { todayStart, todayEnd, sevenDaysStart, thirtyDaysStart, previousThirtyDaysStart, previousThirtyDaysEnd } = ranges;

    const [today, last7days, last30days, previous30days] = await Promise.all([
      this.sumRevenue(tenantId, todayStart, todayEnd),
      this.sumRevenue(tenantId, sevenDaysStart, todayEnd),
      this.sumRevenue(tenantId, thirtyDaysStart, todayEnd),
      this.sumRevenue(tenantId, previousThirtyDaysStart, previousThirtyDaysEnd),
    ]);

    return {
      today,
      last7days,
      last30days,
      previous30days,
    };
  }

  private async sumRevenue(tenantId: string, start: Date, end: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        tenant_id: tenantId,
        status: { in: REVENUE_STATUSES },
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });
    return result._sum.total ?? 0;
  }

  async getOrderMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<OrderMetrics> {
    const { todayStart, todayEnd, sevenDaysStart, thirtyDaysStart } = ranges;

    const [today, last7days, last30days] = await Promise.all([
      this.countOrders(tenantId, todayStart, todayEnd),
      this.countOrders(tenantId, sevenDaysStart, todayEnd),
      this.countOrders(tenantId, thirtyDaysStart, todayEnd),
    ]);

    return {
      today,
      last7days,
      last30days,
    };
  }

  private async countOrders(tenantId: string, start: Date, end: Date): Promise<number> {
    return this.prisma.order.count({
      where: {
        tenant_id: tenantId,
        // Using all valid orders for "Total Pedidos" metric
        status: { in: VALID_ORDER_STATUSES },
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  async getCustomerMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<CustomerMetrics> {
    const { thirtyDaysStart, todayEnd } = ranges;

    // We need to group by customer identifier (phone)
    // Prisma groupBy on 'customer_phone'
    const grouped = await this.prisma.order.groupBy({
      by: ['customer_phone'],
      _count: {
        id: true,
      },
      where: {
        tenant_id: tenantId,
        status: { in: REVENUE_STATUSES }, // Considering active = paid/delivered
        created_at: {
          gte: thirtyDaysStart,
          lte: todayEnd,
        },
        customer_phone: {
          not: null,
        },
      },
    });

    const activeLast30days = grouped.length;
    const withMultipleOrders = grouped.filter(g => g._count.id > 1).length;

    return {
      activeLast30days,
      withMultipleOrders,
    };
  }

  async getTopCustomers(tenantId: string, ranges: DashboardDateRanges, limit: number): Promise<TopCustomer[]> {
    // Top 5 by revenue (all time? or period? Requirement 5 says "Top 5 Clientes (por receita)".
    // Usually implies all time or consistent with dashboard period.
    // Given the dashboard has filters, it likely should respect the period, but "Top Customers" is often an all-time metric or "Best Customers".
    // However, the dashboard context has time filters.
    // "Baseado apenas em dados já existentes".
    // The requirement "5. Top 5 Clientes" is listed separately from "1. Receita (Hoje/7d/30d)".
    // It doesn't explicitly say "Last 30 days".
    // But commonly dashboards show top customers *of the period*.
    // However, for RFM, we usually look at history.
    // Let's assume All Time or Last 30 days?
    // "Clientes Ativos" is defined as "last 30 days".
    // "Top 5 Clientes" follows "Clientes Ativos".
    // I'll stick to the "All Time" for "Best Customers" unless filtered?
    // Actually, to be safe and consistent with typical "Executive Dashboard", let's use the provided period or default to 30d?
    // The prompt says "Query params opcionais: ?period=...".
    // So the service will pass the range. I should use the `ranges.thirtyDaysStart` as default if no custom range, or just use the `ranges` passed.
    // Wait, the repository method receives `ranges`.
    // I will use `thirtyDaysStart` (Last 30 Days) as the default scope for "Top Customers" if the user asks for "Top Customers" in the context of the dashboard.
    // OR, I'll use `todayEnd` (now) back to... forever?
    // Let's look at "5. Top 5 Clientes". It lists "score_rfm".
    // RFM needs history.
    // If I only look at last 30 days, RFM is weak.
    // But "Top Customers (by revenue)" usually means "Who spent the most recently?".
    // I will use `ranges.thirtyDaysStart` to `todayEnd` to show "Top Customers of the Month".
    
    const { thirtyDaysStart, todayEnd } = ranges;

    const grouped = await this.prisma.order.groupBy({
      by: ['customer_phone', 'customer_name'],
      _sum: {
        total: true,
      },
      _max: {
        created_at: true,
      },
      _count: {
        id: true,
      },
      where: {
        tenant_id: tenantId,
        status: { in: REVENUE_STATUSES },
        created_at: {
          gte: thirtyDaysStart, // Using 30 days window
          lte: todayEnd,
        },
        customer_phone: { not: null },
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    return grouped.map(g => ({
      id: g.customer_phone!, // Using phone as ID proxy since we don't have customer_id on order
      name: g.customer_name ?? 'Cliente',
      totalSpent: g._sum.total ?? 0,
      totalOrders: g._count.id,
      phone: g.customer_phone ?? undefined,
      lastOrderAt: g._max.created_at ?? null,
    }));
  }

  async getDeliveryPerformance(tenantId: string, ranges: DashboardDateRanges): Promise<DeliveryPerformance | null> {
    const { thirtyDaysStart, todayEnd } = ranges;

    // Fetch delivered orders with timeline and delivery_info
    // Limit to 30 days to ensure performance
    const orders = await this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['delivered', 'completed'] },
        created_at: {
          gte: thirtyDaysStart,
          lte: todayEnd,
        },
        delivery_info: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        created_at: true,
        delivery_info: true,
        timelineEvents: {
          where: {
            to_status: { in: ['delivered', 'completed'] },
          },
          take: 1,
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
      take: 1000, // Safety limit
    });

    if (orders.length === 0) return null;

    let totalRealTime = 0;
    let totalDiff = 0;
    let count = 0;

    for (const order of orders) {
      const deliveredEvent = order.timelineEvents[0];
      const deliveryInfo = order.delivery_info as Record<string, unknown>;
      const etaMinutes = deliveryInfo.etaMinutes;
      
      if (deliveredEvent && typeof etaMinutes === 'number') {
        const created = new Date(order.created_at).getTime();
        const delivered = new Date(deliveredEvent.timestamp).getTime();
        const realMinutes = (delivered - created) / 60000;
        const predictedMinutes = etaMinutes;

        totalRealTime += realMinutes;
        totalDiff += (realMinutes - predictedMinutes);
        count++;
      }
    }

    if (count === 0) return null;

    return {
      avgRealTimeMinutes: totalRealTime / count,
      avgDiffPredictedRealMinutes: totalDiff / count,
    };
  }
}
