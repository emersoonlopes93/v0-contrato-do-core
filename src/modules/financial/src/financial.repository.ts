import { prisma } from '@/src/adapters/prisma/client';
import type { PaymentsStatus } from '@/src/types/payments';
import type { FinancialPaidOrderRow, TenantFinancialSummaryRow } from './types';

type UpsertSummaryInput = {
  tenantId: string;
  totalOrders: number;
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  totalRefunded: number;
  totalFees: number;
  netAmount: number;
};

export class FinancialRepository {
  async findSummaryByTenantId(tenantId: string): Promise<TenantFinancialSummaryRow | null> {
    const row = await prisma.tenantFinancialSummary.findUnique({
      where: { tenant_id: tenantId },
      select: {
        id: true,
        tenant_id: true,
        total_orders: true,
        total_paid: true,
        total_pending: true,
        total_cancelled: true,
        total_refunded: true,
        total_fees: true,
        net_amount: true,
        updated_at: true,
      },
    });

    return row ?? null;
  }

  async upsertSummary(input: UpsertSummaryInput): Promise<TenantFinancialSummaryRow> {
    return prisma.tenantFinancialSummary.upsert({
      where: { tenant_id: input.tenantId },
      update: {
        total_orders: input.totalOrders,
        total_paid: input.totalPaid,
        total_pending: input.totalPending,
        total_cancelled: input.totalCancelled,
        total_refunded: input.totalRefunded,
        total_fees: input.totalFees,
        net_amount: input.netAmount,
      },
      create: {
        tenant_id: input.tenantId,
        total_orders: input.totalOrders,
        total_paid: input.totalPaid,
        total_pending: input.totalPending,
        total_cancelled: input.totalCancelled,
        total_refunded: input.totalRefunded,
        total_fees: input.totalFees,
        net_amount: input.netAmount,
      },
      select: {
        id: true,
        tenant_id: true,
        total_orders: true,
        total_paid: true,
        total_pending: true,
        total_cancelled: true,
        total_refunded: true,
        total_fees: true,
        net_amount: true,
        updated_at: true,
      },
    });
  }

  async sumPaymentsByStatus(args: {
    tenantId: string;
    statuses: PaymentsStatus[];
    onlyConfirmedOrders?: boolean;
  }): Promise<number> {
    const sum = await prisma.payment.aggregate({
      where: {
        tenant_id: args.tenantId,
        status: { in: args.statuses },
        ...(args.onlyConfirmedOrders ? { order: { status: 'confirmed' } } : {}),
      },
      _sum: { amount: true },
    });

    return sum._sum.amount ?? 0;
  }

  async countPaidOrders(args: { tenantId: string }): Promise<number> {
    return prisma.order.count({
      where: {
        tenant_id: args.tenantId,
        status: 'confirmed',
      },
    });
  }

  async listPaidOrders(args: {
    tenantId: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: FinancialPaidOrderRow[]; total: number }> {
    const skip = (args.page - 1) * args.pageSize;
    const take = args.pageSize;

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          tenant_id: args.tenantId,
          status: 'paid',
          order: { status: 'confirmed' },
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take,
        select: {
          id: true,
          amount: true,
          method: true,
          provider: true,
          updated_at: true,
          order: {
            select: {
              id: true,
              order_number: true,
              total: true,
              created_at: true,
            },
          },
        },
      }),
      prisma.payment.count({
        where: {
          tenant_id: args.tenantId,
          status: 'paid',
          order: { status: 'confirmed' },
        },
      }),
    ]);

    return {
      items: items.map((p) => ({
        payment: {
          id: p.id,
          amount: p.amount,
          method: p.method,
          provider: p.provider,
          updated_at: p.updated_at,
        },
        order: {
          id: p.order.id,
          order_number: p.order.order_number,
          total: p.order.total,
          created_at: p.order.created_at,
        },
      })),
      total,
    };
  }
}
