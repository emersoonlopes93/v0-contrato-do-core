'use client';

import React, { useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { PaymentsCreateRequest, PaymentsDTO, PaymentsMethod, PaymentsProvider } from '@/src/types/payments';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiRequestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function normalizeProvider(value: string | null | undefined): PaymentsProvider {
  if (value === 'asaas') return 'asaas';
  return 'mercado_pago';
}

function PaymentPageContent({ orderId }: { orderId: string }) {
  const { tenantSlug } = useTenant();
  const { tenantSettings } = useSession();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const provider = useMemo(() => normalizeProvider(tenantSettings?.paymentProviderDefault), [tenantSettings?.paymentProviderDefault]);
  const basePath = `/tenant/${tenantSlug}`;

  async function createPayment(method: PaymentsMethod): Promise<void> {
    setIsLoading(true);
    setError('');
    try {
      const payload: PaymentsCreateRequest = {
        orderId,
        method,
        provider,
      };
      const payment = await apiRequestJson<PaymentsDTO>('/api/v1/payments', tenantSlug, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      window.location.href = `${basePath}/payment-status/${payment.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PermissionGuard permission="payments:create">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pagamento</h1>
          <p className="text-muted-foreground">Criar cobrança (PIX / Cartão)</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Provider</CardTitle>
            <CardDescription>Usado como padrão para o tenant</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Provider: {provider}</div>
            <div>Public Key: {tenantSettings?.paymentPublicKey ?? 'null'}</div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PIX</CardTitle>
              <CardDescription>Gera QR Code + copia/cola</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={isLoading} onClick={() => void createPayment('pix')} className="w-full">
                {isLoading ? 'Processando...' : 'Gerar PIX'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cartão</CardTitle>
              <CardDescription>Cria intent (sem dados sensíveis)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={isLoading} onClick={() => void createPayment('card')} className="w-full">
                {isLoading ? 'Processando...' : 'Criar Intent'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const PaymentPage = withModuleGuard(PaymentPageContent, 'payments');
