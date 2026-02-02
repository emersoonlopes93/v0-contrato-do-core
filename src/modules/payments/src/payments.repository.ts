import { prisma } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';

export type PaymentRow = Prisma.PaymentGetPayload<Prisma.PaymentDefaultArgs>;
export type CheckoutOrderRow = Prisma.CheckoutOrderGetPayload<Prisma.CheckoutOrderDefaultArgs>;
export type TenantSettingsRow = Prisma.TenantSettingsGetPayload<Prisma.TenantSettingsDefaultArgs>;

export class PaymentsRepository {
  async findOrderById(tenantId: string, orderId: string): Promise<CheckoutOrderRow | null> {
    return prisma.checkoutOrder.findFirst({
      where: { id: orderId, tenant_id: tenantId },
    });
  }

  async findTenantSettings(tenantId: string): Promise<TenantSettingsRow | null> {
    return prisma.tenantSettings.findUnique({
      where: { tenant_id: tenantId },
    });
  }

  async createPayment(input: {
    tenantId: string;
    orderId: string;
    provider: string;
    method: string;
    amount: number;
    status: string;
    externalId: string;
    qrCode: string | null;
    qrCodeText: string | null;
  }): Promise<PaymentRow> {
    return prisma.payment.create({
      data: {
        tenant_id: input.tenantId,
        order_id: input.orderId,
        provider: input.provider,
        method: input.method,
        amount: input.amount,
        status: input.status,
        external_id: input.externalId,
        qr_code: input.qrCode,
        qr_code_text: input.qrCodeText,
      },
    });
  }

  async findPaymentById(tenantId: string, paymentId: string): Promise<PaymentRow | null> {
    return prisma.payment.findFirst({
      where: { id: paymentId, tenant_id: tenantId },
    });
  }

  async findPaymentByExternalId(provider: string, externalId: string): Promise<PaymentRow | null> {
    return prisma.payment.findFirst({
      where: { provider, external_id: externalId },
    });
  }

  async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  }

  async updateOrderStatus(tenantId: string, orderId: string, status: string): Promise<void> {
    await prisma.checkoutOrder.update({
      where: { id: orderId, tenant_id: tenantId },
      data: { status },
    });
  }
}

