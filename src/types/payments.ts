export type PaymentsProvider = 'mercado_pago' | 'asaas';

export type PaymentsMethod = 'pix' | 'card';

export type PaymentsStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export type PaymentsCreateRequest = {
  orderId: string;
  method: PaymentsMethod;
  provider?: PaymentsProvider;
};

export type PaymentsDTO = {
  id: string;
  orderId: string;
  provider: PaymentsProvider;
  method: PaymentsMethod;
  amount: number;
  status: PaymentsStatus;
  externalId: string;
  qrCode: string | null;
  qrCodeText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentsServiceContract = {
  createPayment(tenantId: string, input: PaymentsCreateRequest): Promise<PaymentsDTO>;
  getPaymentById(tenantId: string, paymentId: string): Promise<PaymentsDTO | null>;
  handleWebhook(provider: PaymentsProvider, headers: Record<string, string>, body: unknown): Promise<void>;
};

