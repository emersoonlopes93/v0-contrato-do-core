'use client';

import React from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { useCashier } from '@/src/modules/cashier/src/hooks/useCashier';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ORDERS_OPERATIONAL_STATUS } from '@/src/types/orders';
import { CashierSummaryCard } from '@/src/modules/cashier/src/components/CashierSummaryCard';

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function CashierPageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken, tenantSettings } = useSession();
  const realtimeEnabled = tenantSettings?.realtimeEnabled ?? true;
  const { session, orders, loading, error, updateHint, openCashier, closeCashier, resetCashier, reload } = useCashier(
    accessToken,
    tenantSlug,
    { realtimeEnabled },
  );
  const [openingAmount, setOpeningAmount] = React.useState('');
  const [closingAmount, setClosingAmount] = React.useState('');
  const [processingAction, setProcessingAction] = React.useState<'open' | 'close' | 'reset' | null>(null);

  const currency = 'BRL';

  const filteredOrders = React.useMemo(() => {
    if (!session?.openedAt) return [];
    const openedAt = new Date(session.openedAt);
    const closedAt = session.closedAt ? new Date(session.closedAt) : null;
    const end = closedAt ?? new Date();
    return orders.filter((order) => {
      const created = new Date(order.createdAt);
      if (created < openedAt || created > end) return false;
      return order.status !== ORDERS_OPERATIONAL_STATUS.CANCELED;
    });
  }, [orders, session]);

  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  const handleOpen = () => {
    const value = Number(openingAmount);
    if (!Number.isFinite(value)) return;
    if (!window.confirm('Confirmar abertura de caixa?')) return;
    if (processingAction) return;
    setProcessingAction('open');
    openCashier(value);
    setProcessingAction(null);
  };

  const handleClose = () => {
    const value = Number(closingAmount);
    if (!Number.isFinite(value)) return;
    if (!window.confirm('Confirmar fechamento de caixa?')) return;
    if (processingAction) return;
    setProcessingAction('close');
    closeCashier(value);
    setProcessingAction(null);
  };

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="cashier.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Caixa</h1>
          <p className="text-muted-foreground">Abertura e fechamento do caixa único</p>
        </div>

        {realtimeEnabled && (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {updateHint && !error && (
          <Alert>
            <AlertDescription>{updateHint}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Caixa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!session && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Valor inicial</Label>
                      <Input value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
                    </div>
                    <Button onClick={handleOpen} disabled={processingAction === 'open'}>
                      Abrir caixa
                    </Button>
                  </div>
                )}

                {session && session.closedAt === null && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Aberto em {new Date(session.openedAt).toLocaleString('pt-BR')}
                    </div>
                    <div className="space-y-2">
                      <Label>Valor final</Label>
                      <Input value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} />
                    </div>
                    <Button onClick={handleClose} disabled={processingAction === 'close'}>
                      Fechar caixa
                    </Button>
                  </div>
                )}

                {session && session.closedAt !== null && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Fechado em {new Date(session.closedAt).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Valor inicial</span>
                        <span>{formatCurrency(session.openingAmount, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Valor final</span>
                        <span>{formatCurrency(session.closingAmount ?? 0, currency)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!window.confirm('Confirmar abertura de um novo caixa?')) return;
                        if (processingAction) return;
                        setProcessingAction('reset');
                        resetCashier();
                        setProcessingAction(null);
                      }}
                      disabled={processingAction === 'reset'}
                    >
                      Abrir novo caixa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <CashierSummaryCard
              totalOrders={totalOrders}
              totalAmount={formatCurrency(totalAmount, currency)}
              hasSession={Boolean(session)}
            />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const CashierPage = withModuleGuard(CashierPageContent, 'cashier');
