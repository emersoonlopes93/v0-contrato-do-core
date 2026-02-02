import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  PaymentsCreateRequest,
  PaymentsDTO,
  PaymentsProvider,
  PaymentsServiceContract,
  PaymentsStatus,
} from '@/src/types/payments';
import { globalRealtimeEmitter, REALTIME_CHECKOUT_EVENTS, REALTIME_PAYMENT_EVENTS } from '@/src/core';
import { PaymentsRepository } from './payments.repository';
import type { PaymentsProviderContract } from './types';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';
import { AsaasProvider } from './providers/asaas.provider';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isPaymentsProvider(value: unknown): value is PaymentsProvider {
  return value === 'mercado_pago' || value === 'asaas';
}

function isPaymentsMethod(value: unknown): value is 'pix' | 'card' {
  return value === 'pix' || value === 'card';
}

function isPaymentsStatus(value: unknown): value is PaymentsStatus {
  return value === 'pending' || value === 'paid' || value === 'failed' || value === 'cancelled' || value === 'refunded';
}

function toDTO(row: { id: string; order_id: string; provider: string; method: string; amount: number; status: string; external_id: string; qr_code: string | null; qr_code_text: string | null; created_at: Date; updated_at: Date }): PaymentsDTO {
  const provider: PaymentsProvider = row.provider === 'asaas' ? 'asaas' : 'mercado_pago';
  const method = row.method === 'card' ? 'card' : 'pix';
  const status: PaymentsStatus = isPaymentsStatus(row.status) ? row.status : 'pending';
  return {
    id: row.id,
    orderId: row.order_id,
    provider,
    method,
    amount: row.amount,
    status,
    externalId: row.external_id,
    qrCode: row.qr_code ?? null,
    qrCodeText: row.qr_code_text ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function parsePaymentsCreateRequest(value: unknown): { data: PaymentsCreateRequest } | { error: string } {
  if (!isRecord(value)) return { error: 'Body inválido' };
  const orderId = value.orderId;
  const method = value.method;
  const provider = value.provider;
  if (!isString(orderId) || orderId.trim() === '') return { error: 'orderId inválido' };
  if (!isPaymentsMethod(method)) return { error: 'method inválido' };
  if (provider !== undefined && !isPaymentsProvider(provider)) return { error: 'provider inválido' };
  return { data: { orderId: orderId.trim(), method, provider } };
}

export class PaymentsService implements PaymentsServiceContract {
  private readonly repo: PaymentsRepository;
  private readonly providers: Record<PaymentsProvider, PaymentsProviderContract>;

  constructor(context: ModuleContext) {
    void context;
    this.repo = new PaymentsRepository();
    this.providers = {
      mercado_pago: new MercadoPagoProvider(),
      asaas: new AsaasProvider(),
    };
  }

  async createPayment(tenantId: string, input: PaymentsCreateRequest): Promise<PaymentsDTO> {
    const order = await this.repo.findOrderById(tenantId, input.orderId);
    if (!order) throw new Error('Pedido não encontrado');
    if (order.status !== 'pending') throw new Error('Pedido inválido para pagamento');

    const tenantSettings = await this.repo.findTenantSettings(tenantId);
    const providerDefaultRaw = tenantSettings?.payment_provider_default ?? null;
    const provider: PaymentsProvider =
      input.provider ??
      (providerDefaultRaw === 'asaas' ? 'asaas' : 'mercado_pago');

    const publicKey = tenantSettings?.payment_public_key ?? null;
    const privateKey = tenantSettings?.payment_private_key ?? null;

    const amount = order.total;
    const charge = await this.providers[provider].createCharge({
      tenantId,
      orderId: order.id,
      amount,
      method: input.method,
      provider,
      publicKey,
      privateKey,
    });

    const row = await this.repo.createPayment({
      tenantId,
      orderId: order.id,
      provider,
      method: input.method,
      amount,
      status: 'pending',
      externalId: charge.externalId,
      qrCode: charge.qrCode,
      qrCodeText: charge.qrCodeText,
    });

    globalRealtimeEmitter.emitToTenant(
      tenantId,
      REALTIME_CHECKOUT_EVENTS.CHECKOUT_AWAITING_PAYMENT,
      {
        orderId: row.order_id,
        paymentId: row.id,
        provider,
        method: input.method,
        status: row.status,
        amount: row.amount,
      },
    );

    return toDTO(row);
  }

  async getPaymentById(tenantId: string, paymentId: string): Promise<PaymentsDTO | null> {
    const row = await this.repo.findPaymentById(tenantId, paymentId);
    return row ? toDTO(row) : null;
  }

  async handleWebhook(provider: PaymentsProvider, headers: Record<string, string>, body: unknown): Promise<void> {
    const parsed = this.providers[provider].parseWebhook(body);
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }

    const payment = await this.repo.findPaymentByExternalId(provider, parsed.externalId);
    if (!payment) {
      return;
    }

    const tenantSettings = await this.repo.findTenantSettings(payment.tenant_id);
    const privateKey = tenantSettings?.payment_private_key ?? null;
    const signatureOk = this.providers[provider].verifyWebhookSignature({
      headers,
      body,
      privateKey,
    });
    if (!signatureOk) {
      throw new Error('Assinatura inválida');
    }

    await this.repo.updatePaymentStatus(payment.id, parsed.status);

    if (parsed.status === 'paid') {
      await this.repo.updateOrderStatus(payment.tenant_id, payment.order_id, 'confirmed');
      globalRealtimeEmitter.emitToTenant(
        payment.tenant_id,
        REALTIME_PAYMENT_EVENTS.PAYMENT_CONFIRMED,
        {
          paymentId: payment.id,
          orderId: payment.order_id,
          status: parsed.status,
          provider,
        },
      );
    } else if (parsed.status === 'failed') {
      globalRealtimeEmitter.emitToTenant(
        payment.tenant_id,
        REALTIME_PAYMENT_EVENTS.PAYMENT_FAILED,
        {
          paymentId: payment.id,
          orderId: payment.order_id,
          status: parsed.status,
          provider,
        },
      );
    } else if (parsed.status === 'cancelled') {
      await this.repo.updateOrderStatus(payment.tenant_id, payment.order_id, 'cancelled');
      globalRealtimeEmitter.emitToTenant(
        payment.tenant_id,
        REALTIME_PAYMENT_EVENTS.PAYMENT_EXPIRED,
        {
          paymentId: payment.id,
          orderId: payment.order_id,
          status: parsed.status,
          provider,
        },
      );
    }
  }
}
