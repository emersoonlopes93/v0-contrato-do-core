import type { ModuleContext } from '@/src/core/modules/contracts';
import type { FinancialOrdersListDTO, FinancialServiceContract, FinancialSummaryDTO } from '@/src/types/financial';
import type { PaymentsStatus } from '@/src/types/payments';
import { globalRealtimeEmitter, REALTIME_FINANCIAL_EVENTS } from '@/src/core';
import { FinancialRepository } from './financial.repository';

function toFixedNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

export class FinancialService implements FinancialServiceContract {
  private readonly repository: FinancialRepository;

  constructor(context: ModuleContext) {
    void context;
    this.repository = new FinancialRepository();
  }

  async getSummary(tenantId: string): Promise<FinancialSummaryDTO> {
    const paidStatuses: PaymentsStatus[] = ['paid'];
    const pendingStatuses: PaymentsStatus[] = ['pending'];
    const cancelledStatuses: PaymentsStatus[] = ['cancelled', 'failed'];
    const refundedStatuses: PaymentsStatus[] = ['refunded'];

    const [
      totalPaid,
      totalPending,
      totalCancelled,
      totalRefunded,
      totalOrders,
    ] = await Promise.all([
      this.repository.sumPaymentsByStatus({
        tenantId,
        statuses: paidStatuses,
        onlyConfirmedOrders: true,
      }),
      this.repository.sumPaymentsByStatus({
        tenantId,
        statuses: pendingStatuses,
      }),
      this.repository.sumPaymentsByStatus({
        tenantId,
        statuses: cancelledStatuses,
      }),
      this.repository.sumPaymentsByStatus({
        tenantId,
        statuses: refundedStatuses,
      }),
      this.repository.countPaidOrders({ tenantId }),
    ]);

    const totalFees = 0;
    const netAmount = toFixedNumber(totalPaid - totalFees);

    const updated = await this.repository.upsertSummary({
      tenantId,
      totalOrders,
      totalPaid: toFixedNumber(totalPaid),
      totalPending: toFixedNumber(totalPending),
      totalCancelled: toFixedNumber(totalCancelled),
      totalRefunded: toFixedNumber(totalRefunded),
      totalFees: toFixedNumber(totalFees),
      netAmount,
    });

    const dto: FinancialSummaryDTO = {
      id: updated.id,
      tenantId: updated.tenant_id,
      totalOrders: updated.total_orders,
      totalPaid: updated.total_paid,
      totalPending: updated.total_pending,
      totalCancelled: updated.total_cancelled,
      totalRefunded: updated.total_refunded,
      totalFees: updated.total_fees,
      netAmount: updated.net_amount,
      updatedAt: updated.updated_at.toISOString(),
    };

    globalRealtimeEmitter.emitToTenant(
      tenantId,
      REALTIME_FINANCIAL_EVENTS.FINANCIAL_UPDATED,
      dto,
    );

    return dto;
  }

  async listPaidOrders(args: {
    tenantId: string;
    page: number;
    pageSize: number;
  }): Promise<FinancialOrdersListDTO> {
    const data = await this.repository.listPaidOrders({
      tenantId: args.tenantId,
      page: args.page,
      pageSize: args.pageSize,
    });

    return {
      items: data.items.map((i) => ({
        orderId: i.order.id,
        orderNumber: i.order.order_number,
        total: i.order.total,
        paymentId: i.payment.id,
        paymentMethod: i.payment.method,
        paymentProvider: i.payment.provider,
        paidAt: i.payment.updated_at.toISOString(),
        createdAt: i.order.created_at.toISOString(),
      })),
      page: args.page,
      pageSize: args.pageSize,
      total: data.total,
    };
  }
}
