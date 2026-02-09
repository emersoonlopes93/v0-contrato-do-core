'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenant } from '@/src/contexts/TenantContext';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import type { DeliveryDriverAppOrderDTO } from '@/src/types/delivery-driver-app';
import { useDriverSession } from '../hooks/DriverSessionContext';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { getCurrentOrder, getDriverById, setDriverStatus } from '../services/deliveryDriverAppService';

const DRIVER_ID_KEY = 'delivery_driver_app_driver_id';

function getStatusLabel(driver: DeliveryDriverDTO | null): string {
  if (!driver) return 'Offline';
  if (driver.status === 'offline') return 'Offline';
  if (driver.activeOrderId) return 'Em rota';
  return 'Parado';
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DeliveryDriverAppPage() {
  const { tenantSlug } = useTenant();
  const {
    accessToken,
    tenantId,
    loading: sessionLoading,
    error: sessionError,
    login,
    logout,
    activeModules,
  } = useDriverSession();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [driverIdInput, setDriverIdInput] = React.useState('');
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const [driver, setDriver] = React.useState<DeliveryDriverDTO | null>(null);
  const [order, setOrder] = React.useState<DeliveryDriverAppOrderDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const moduleEnabled = activeModules.includes('delivery-driver-app');

  React.useEffect(() => {
    const stored = localStorage.getItem(DRIVER_ID_KEY);
    if (stored) {
      setDriverId(stored);
      setDriverIdInput(stored);
    }
  }, []);

  React.useEffect(() => {
    if (!driverId) {
      setDriver(null);
      return;
    }
    const current = getDriverById(tenantSlug, driverId);
    setDriver(current);
  }, [tenantSlug, driverId]);

  React.useEffect(() => {
    if (!accessToken || !driver?.activeOrderId) {
      setOrder(null);
      return;
    }
    setActionLoading(true);
    getCurrentOrder(accessToken, driver.activeOrderId)
      .then((data) => setOrder(data))
      .catch((err) => {
        setOrder(null);
        setError(err instanceof Error ? err.message : 'Falha ao carregar pedido');
      })
      .finally(() => setActionLoading(false));
  }, [accessToken, driver?.activeOrderId]);

  const locationState = useDriverLocation({
    tenantSlug,
    tenantId: tenantId ?? '',
    driverId: driver?.id ?? '',
    activeOrderId: driver?.activeOrderId ?? null,
    accessToken,
    enabled: Boolean(driver && driver.status !== 'offline' && tenantId),
    onDriverUpdate: setDriver,
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    await login(email, password);
  };

  const handleAssignDriver = () => {
    setError(null);
    const trimmed = driverIdInput.trim();
    if (!trimmed) {
      setError('Informe o ID do entregador');
      return;
    }
    const current = getDriverById(tenantSlug, trimmed);
    if (!current) {
      setError('Entregador não encontrado');
      return;
    }
    localStorage.setItem(DRIVER_ID_KEY, trimmed);
    setDriverId(trimmed);
  };

  const handleStart = async () => {
    if (!driver) return;
    if (!driver.activeOrderId) {
      setError('Nenhum pedido atribuído');
      return;
    }
    setActionLoading(true);
    try {
      const updated = setDriverStatus(tenantSlug, driver.id, {
        status: 'delivering',
        activeOrderId: driver.activeOrderId,
      });
      setDriver(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar entrega');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!driver) return;
    setActionLoading(true);
    try {
      const updated = setDriverStatus(tenantSlug, driver.id, {
        status: 'available',
        activeOrderId: null,
      });
      setDriver(updated);
      setOrder(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao finalizar entrega');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOffline = async () => {
    if (!driver) return;
    setActionLoading(true);
    try {
      const updated = setDriverStatus(tenantSlug, driver.id, {
        status: 'offline',
        activeOrderId: null,
      });
      setDriver(updated);
      setOrder(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    } finally {
      setActionLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login do Entregador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driver-email">Email</Label>
                <Input
                  id="driver-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-password">Senha</Label>
                <Input
                  id="driver-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {sessionError && (
                <Alert variant="destructive">
                  <AlertDescription>{sessionError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="h-11 w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!moduleEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Módulo desativado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O app do entregador não está ativo para este tenant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tenant</p>
            <p className="text-sm font-semibold">{tenantSlug}</p>
          </div>
          <Button variant="ghost" onClick={logout}>
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entregador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="driver-id">ID do entregador</Label>
              <div className="flex gap-2">
                <Input
                  id="driver-id"
                  value={driverIdInput}
                  onChange={(event) => setDriverIdInput(event.target.value)}
                  className="h-11"
                />
                <Button onClick={handleAssignDriver} className="h-11">
                  Confirmar
                </Button>
              </div>
            </div>
            {driver && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{driver.name}</p>
                <Badge>{getStatusLabel(driver)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedido atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!driver?.activeOrderId && (
              <p className="text-sm text-muted-foreground">Nenhum pedido atribuído</p>
            )}
            {driver?.activeOrderId && order && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pedido #{order.orderNumber}</p>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.customerName ?? 'Cliente não informado'}
                </div>
                <div className="text-sm">{formatMoney(order.total)}</div>
              </div>
            )}
            {driver?.activeOrderId && !order && (
              <p className="text-sm text-muted-foreground">Carregando pedido...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleStart} disabled={actionLoading || !driver?.activeOrderId}>
                Iniciar entrega
              </Button>
              <Button onClick={handleFinish} disabled={actionLoading || !driver}>
                Finalizar entrega
              </Button>
              <Button variant="outline" onClick={handleOffline} disabled={actionLoading || !driver}>
                Ficar offline
              </Button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Status GPS: {locationState.status}</div>
              <div>
                Última atualização:{' '}
                {locationState.lastUpdateAt ? new Date(locationState.lastUpdateAt).toLocaleTimeString() : '—'}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
