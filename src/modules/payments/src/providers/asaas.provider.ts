import crypto from 'crypto';
import type { PaymentsProviderContract, PaymentsWebhookParseResult, PaymentsCreateChargeInput, PaymentsProviderChargeResult } from '../types';
import type { PaymentsStatus } from '@/src/types/payments';

import { isRecord } from '@/src/core/utils/type-guards';

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

export class AsaasProvider implements PaymentsProviderContract {
  async createCharge(input: PaymentsCreateChargeInput): Promise<PaymentsProviderChargeResult> {
    const mockMode = !input.privateKey || input.privateKey.startsWith('mock_');
    if (mockMode) {
      const externalId = `asaas_mock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      if (input.method === 'pix') {
        return {
          externalId,
          qrCode: `https://example.com/qr/${externalId}`,
          qrCodeText: `00020126ASAASTEST${externalId}5204000053039865802BR5925TENANT_${input.tenantId}6009SAO_PAULO6304EFGH`,
        };
      }
      return { externalId, qrCode: null, qrCodeText: null };
    }

    const token = input.privateKey;
    if (!token) {
      throw new Error('Chave privada ausente');
    }
    const baseUrl = 'https://api.asaas.com';

    const billingType = input.method === 'pix' ? 'PIX' : 'CREDIT_CARD';
    const res = await fetch(`${baseUrl}/v3/payments`, {
      method: 'POST',
      headers: {
        access_token: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingType,
        value: input.amount,
        description: `Order ${input.orderId}`,
      }),
    });

    const json: unknown = await res.json().catch(() => null);
    if (!res.ok || !isRecord(json) || !isString(json.id)) throw new Error('Falha ao criar cobrança (Asaas)');
    const externalId = json.id;

    if (input.method !== 'pix') return { externalId, qrCode: null, qrCodeText: null };

    const pixRes = await fetch(`${baseUrl}/v3/payments/${encodeURIComponent(externalId)}/pixQrCode`, {
      method: 'GET',
      headers: {
        access_token: token,
      },
    });
    const pixJson: unknown = await pixRes.json().catch(() => null);
    if (!pixRes.ok || !isRecord(pixJson)) return { externalId, qrCode: null, qrCodeText: null };
    const qrCode = isString(pixJson.encodedImage) ? pixJson.encodedImage : null;
    const qrCodeText = isString(pixJson.payload) ? pixJson.payload : null;
    return { externalId, qrCode, qrCodeText };
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
    const sig = args.headers['x-asaas-signature'] ?? args.headers['X-Asaas-Signature'] ?? '';
    if (typeof sig !== 'string' || sig.trim() === '') return false;
    const expected = computeSignature(args.privateKey, args.body);
    return sig.trim() === expected;
  }
}
