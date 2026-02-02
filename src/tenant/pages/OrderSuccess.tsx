'use client';

import React, { useEffect, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { CheckoutOrderDTO } from '@/src/types/checkout';

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

function OrderSuccessPageContent({ orderId }: { orderId: string }) {
  const { tenantSlug } = useTenant();
  const { accessToken } = useSession();
  const [order, setOrder] = useState<CheckoutOrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<CheckoutOrderDTO>(`/api/v1/orders/${orderId}`, accessToken);
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar pedido');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, orderId]);

  if (!accessToken) return null;

  const basePath = `/tenant/${tenantSlug}`;
  return (
    <PermissionGuard permission="checkout:create">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pedido Confirmado</h1>
          <p className="text-muted-foreground">Status e número do pedido</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : order ? (
          <Card>
            <CardHeader>
              <CardTitle>Pedido #{order.orderNumber}</CardTitle>
              <CardDescription>Status: {order.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                Cliente: <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="text-sm">
                Pagamento: <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => (window.location.href = `${basePath}/checkout`)}>
                  Novo Pedido
                </Button>
                <Button onClick={() => (window.location.href = `${basePath}/dashboard`)}>Voltar</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>Pedido não encontrado</AlertDescription>
          </Alert>
        )}
      </div>
    </PermissionGuard>
  );
}

export const OrderSuccessPage = withModuleGuard(OrderSuccessPageContent, 'checkout');

