'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ApiSuccessResponse<T> = { success: true; data: T };
type ApiErrorResponse = { error: string; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}
function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

type PublicOrderSummary = {
  orderId: string;
  publicOrderCode: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  items: Array<{ name: string; quantity: number; total: number }>;
  totals: { subtotal: number; discount: number; total: number; currency: string };
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const tenantSlug = params.slug ?? '';
  const code = params.code ?? '';
  const [data, setData] = useState<PublicOrderSummary | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/v1/menu/${encodeURIComponent(tenantSlug)}/order/${encodeURIComponent(code)}`);
        const raw: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          if (isApiErrorResponse(raw)) {
            setError(raw.message);
            return;
          }
          setError('Falha ao carregar pedido');
          return;
        }
        if (isApiSuccessResponse<PublicOrderSummary>(raw)) {
          setData(raw.data);
          return;
        }
        setError('Resposta inválida do servidor');
      } catch {
        setError('Falha ao carregar pedido');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, code]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Confirmação do Pedido</h1>
        <p className="text-muted-foreground">Pedido enviado para o restaurante</p>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && <div className="mt-4 text-sm text-muted-foreground">Carregando...</div>}

        {!isLoading && !error && data && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Código do pedido</div>
              <div className="text-base font-semibold">#{data.publicOrderCode}</div>
              <div className="mt-2 text-sm">Status: {data.status}</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm font-semibold">Resumo</div>
              <div className="mt-2 space-y-1">
                {data.items.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{i.quantity} x {i.name}</span>
                    <span>{data.totals.currency} {i.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 rounded border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{data.totals.currency} {data.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span>{data.totals.currency} {data.totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{data.totals.currency} {data.totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

