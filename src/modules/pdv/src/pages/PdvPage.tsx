'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { usePdv } from '@/src/modules/pdv/src/hooks/usePdv';
import { ORDERS_STATUS_LABELS } from '@/src/types/orders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PdvProductRow } from '@/src/modules/pdv/src/components/PdvProductRow';
import { PdvCartItemRow } from '@/src/modules/pdv/src/components/PdvCartItemRow';
import type { CashierSession } from '@/src/types/cashier';

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCashierSession(value: unknown): value is CashierSession {
  if (!isRecord(value)) return false;
  return (
    typeof value.openedAt === 'string' &&
    typeof value.openingAmount === 'number' &&
    'closedAt' in value &&
    'closingAmount' in value
  );
}

function readCashierSession(tenantSlug: string): CashierSession | null {
  const raw = window.localStorage.getItem(`cashier-session:${tenantSlug}`);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCashierSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function PdvPageContent() {
  const { accessToken, tenantSettings } = useSession();
  const { tenantSlug } = useTenant();
  const pdvEnabled = tenantSettings?.pdvEnabled ?? true;
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const {
    products,
    categories,
    settings,
    cart,
    summary,
    recentOrders,
    ordersLoading,
    ordersError,
    loading,
    submitting,
    error,
    submitError,
    customerName,
    customerPhone,
    deliveryType,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerName,
    setCustomerPhone,
    setDeliveryType,
    submitOrder,
    refreshMenu,
    refreshOrders,
  } = usePdv(accessToken, { enabled: pdvEnabled, realtimeEnabled });

  const currency = settings?.currency ?? 'BRL';
  const hasProducts = products.length > 0;
  const hasCart = cart.length > 0;

  const categoriesById = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products]);

  const cashierSession = React.useMemo(() => readCashierSession(tenantSlug), [tenantSlug]);
  const cashierOpen = cashierSession?.closedAt === null;
  const canSubmit = hasCart && cashierOpen && !submitting && pdvEnabled;

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="pdv.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">PDV</h1>
          <p className="text-muted-foreground">Crie pedidos rápidos no balcão</p>
        </div>

        {realtimeEnabled && (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </div>
        )}

        {!pdvEnabled && (
          <Alert>
            <AlertDescription>PDV desativado nas configurações do tenant.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refreshMenu()} disabled={loading}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {!cashierOpen && (
          <Alert>
            <AlertDescription>Abra o caixa para finalizar pedidos no PDV.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Carregando cardápio...</div>
                ) : !hasProducts ? (
                  <div className="text-sm text-muted-foreground">Nenhum produto disponível.</div>
                ) : (
                  <div className="space-y-3">
                    {sortedProducts.map((product) => (
                      <div key={product.id} className="space-y-2">
                        <PdvProductRow
                          product={product}
                          onAdd={addItem}
                          currency={currency}
                          disabled={!pdvEnabled}
                        />
                        {product.categoryId && categoriesById.get(product.categoryId) && (
                          <div className="text-xs text-muted-foreground">
                            {categoriesById.get(product.categoryId)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={!pdvEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={!pdvEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    disabled={!pdvEnabled}
                  >
                    <option value="">Selecione</option>
                    <option value="balcao">Balcão</option>
                    <option value="mesa">Mesa</option>
                    <option value="delivery">Delivery</option>
                    <option value="retirada">Retirada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {hasCart ? (
                    cart.map((item) => (
                      <PdvCartItemRow
                        key={item.product.id}
                        item={item}
                        currency={currency}
                        onRemove={removeItem}
                        onUpdateQuantity={updateQuantity}
                        disabled={!pdvEnabled}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum item no pedido.</div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(summary.subtotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(summary.total, currency)}</span>
                  </div>
                </div>

                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={clearCart} disabled={!hasCart || !pdvEnabled}>
                    Limpar
                  </Button>
                  <Button
                    onClick={() => {
                      if (!window.confirm('Confirmar finalização do pedido?')) return;
                      void submitOrder();
                    }}
                    disabled={!canSubmit}
                  >
                    {submitting ? 'Finalizando...' : 'Finalizar pedido'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ordersLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando pedidos...</div>
                ) : ordersError ? (
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{ordersError}</span>
                    <Button variant="outline" size="sm" onClick={() => void refreshOrders()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum pedido recente.</div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {ORDERS_STATUS_LABELS[order.status] ?? order.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const PdvPage = withModuleGuard(PdvPageContent, 'pdv');
