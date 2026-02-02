import type { PaymentsMethod, PaymentsProvider, PaymentsStatus } from '@/src/types/payments';

export type PaymentsProviderChargeResult = {
  externalId: string;
  qrCode: string | null;
  qrCodeText: string | null;
};

export type PaymentsCreateChargeInput = {
  tenantId: string;
  orderId: string;
  amount: number;
  method: PaymentsMethod;
  provider: PaymentsProvider;
  publicKey: string | null;
  privateKey: string | null;
};

export type PaymentsWebhookParseResult =
  | {
      ok: true;
      externalId: string;
      status: PaymentsStatus;
    }
  | {
      ok: false;
      error: string;
    };

export type PaymentsProviderContract = {
  createCharge(input: PaymentsCreateChargeInput): Promise<PaymentsProviderChargeResult>;
  parseWebhook(body: unknown): PaymentsWebhookParseResult;
  verifyWebhookSignature(args: {
    headers: Record<string, string>;
    body: unknown;
    privateKey: string | null;
  }): boolean;
};

