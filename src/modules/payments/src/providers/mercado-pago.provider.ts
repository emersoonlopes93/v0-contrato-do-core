import crypto from 'crypto';
import type { PaymentsProviderContract, PaymentsWebhookParseResult, PaymentsCreateChargeInput, PaymentsProviderChargeResult } from '../types';
import type { PaymentsStatus } from '@/src/types/payments';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function normalizeStatus(value: string): PaymentsStatus {
  if (value === 'paid') return 'paid';
  if (value === 'failed') return 'failed';
  if (value === 'cancelled') return 'cancelled';
  if (value === 'refunded') return 'refunded';
  return 'pending';
}

function computeSignature(privateKey: string, body: unknown): string {
  const payload = JSON.stringify(body ?? null);
  return crypto.createHmac('sha256', privateKey).update(payload).digest('hex');
}

export class MercadoPagoProvider implements PaymentsProviderContract {
  async createCharge(input: PaymentsCreateChargeInput): Promise<PaymentsProviderChargeResult> {
    const mockMode = !input.privateKey || input.privateKey.startsWith('mock_');
    if (mockMode) {
      const externalId = `mp_mock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      if (input.method === 'pix') {
        return {
          externalId,
          qrCode: `https://example.com/qr/${externalId}`,
          qrCodeText: `00020126360014BR.GOV.BCB.PIX0114+5500000000005204000053039865802BR5925TENANT_${input.tenantId}6009SAO_PAULO62140510${externalId}6304ABCD`,
        };
      }
      return { externalId, qrCode: null, qrCodeText: null };
    }

    const token = input.privateKey;
    if (!token) {
      throw new Error('Chave privada ausente');
    }
    const baseUrl = 'https://api.mercadopago.com';

    if (input.method === 'pix') {
      const res = await fetch(`${baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: input.amount,
          description: `Order ${input.orderId}`,
          payment_method_id: 'pix',
        }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok || !isRecord(json)) throw new Error('Falha ao criar cobrança PIX (Mercado Pago)');
      const id = json.id;
      const qr = isRecord(json.point_of_interaction) ? json.point_of_interaction : null;
      const tx = qr && isRecord(qr.transaction_data) ? qr.transaction_data : null;
      const qrCode = tx && isString(tx.qr_code_base64) ? tx.qr_code_base64 : null;
      const qrText = tx && isString(tx.qr_code) ? tx.qr_code : null;
      if (!isString(id)) throw new Error('Resposta inválida do Mercado Pago');
      return { externalId: id, qrCode, qrCodeText: qrText };
    }

    const res = await fetch(`${baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: input.amount,
        description: `Order ${input.orderId}`,
        payment_method_id: 'visa',
      }),
    });

    const json: unknown = await res.json().catch(() => null);
    if (!res.ok || !isRecord(json) || !isString(json.id)) throw new Error('Falha ao criar intent (Mercado Pago)');
    return { externalId: json.id, qrCode: null, qrCodeText: null };
  }

  parseWebhook(body: unknown): PaymentsWebhookParseResult {
    if (!isRecord(body)) return { ok: false, error: 'Body inválido' };
    const externalId = body.externalId;
    const status = body.status;
    if (!isString(externalId) || externalId.trim() === '') return { ok: false, error: 'externalId inválido' };
    if (!isString(status) || status.trim() === '') return { ok: false, error: 'status inválido' };
    return { ok: true, externalId: externalId.trim(), status: normalizeStatus(status.trim()) };
  }

  verifyWebhookSignature(args: { headers: Record<string, string>; body: unknown; privateKey: string | null }): boolean {
    if (!args.privateKey) return false;
    const sig = args.headers['x-mp-signature'] ?? args.headers['X-MP-Signature'] ?? '';
    if (typeof sig !== 'string' || sig.trim() === '') return false;
    const expected = computeSignature(args.privateKey, args.body);
    return sig.trim() === expected;
  }
}
