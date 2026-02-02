'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { PaymentsDTO } from '@/src/types/payments';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

function PaymentStatusPageContent({ paymentId }: { paymentId: string }) {
  const { tenantSlug } = useTenant();
  const { accessToken } = useSession();
  const [payment, setPayment] = useState<PaymentsDTO | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const basePath = `/tenant/${tenantSlug}`;

  const canPoll = useMemo(() => payment?.status === 'pending', [payment?.status]);
  const showPix = payment?.method === 'pix';

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const load = async () => {
      setError('');
      try {
        const data = await apiGet<PaymentsDTO>(`/api/v1/payments/${paymentId}`, accessToken);
        if (!cancelled) setPayment(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar pagamento');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    if (!canPoll) return () => { cancelled = true; };

    const interval = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [accessToken, paymentId, canPoll]);

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="payments:create">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Status do Pagamento</h1>
          <p className="text-muted-foreground">Atualização automática via webhook + polling</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : payment ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
                <CardDescription>ID: {payment.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Provider: {payment.provider}</div>
                <div>Método: {payment.method}</div>
                <div>Status: {payment.status}</div>
                <div>Valor: {payment.amount}</div>
                <div>External ID: {payment.externalId}</div>
              </CardContent>
            </Card>

            {showPix && (
              <Card>
                <CardHeader>
                  <CardTitle>PIX</CardTitle>
                  <CardDescription>QR Code + copia/cola</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payment.qrCode ? (
                    <div className="text-sm">
                      QR Code: <a href={payment.qrCode} className="underline underline-offset-4">{payment.qrCode}</a>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">QR Code não disponível</div>
                  )}

                  <div className="space-y-2">
                    <Label>Copia e Cola</Label>
                    <Input readOnly value={payment.qrCodeText ?? ''} />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => (window.location.href = `${basePath}/dashboard`)}>
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>Pagamento não encontrado</AlertDescription>
          </Alert>
        )}
      </div>
    </PermissionGuard>
  );
}

export const PaymentStatusPage = withModuleGuard(PaymentStatusPageContent, 'payments');
