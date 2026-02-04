'use client';

import React, { useEffect, useState } from 'react';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormFooterSaveBar } from '@/components/form/FormFooterSaveBar';
import { toast } from '@/hooks/use-toast';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCashbackConfigDTO,
  MenuOnlineLoyaltyConfigDTO,
  MenuOnlineUpdateCashbackConfigRequest,
  MenuOnlineUpdateLoyaltyConfigRequest,
} from '@/src/types/menu-online';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiRequestJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

function MenuOnlineRewardsPageContent() {
  const { accessToken } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [loyalty, setLoyalty] = useState<MenuOnlineLoyaltyConfigDTO | null>(null);
  const [cashback, setCashback] = useState<MenuOnlineCashbackConfigDTO | null>(null);

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [pointsPerCurrency, setPointsPerCurrency] = useState<number>(0);
  const [currencyPerPoint, setCurrencyPerPoint] = useState<number>(0);

  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [cashbackPercent, setCashbackPercent] = useState<number>(0);
  const [cashbackExpiresDays, setCashbackExpiresDays] = useState<string>('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [loyaltyData, cashbackData] = await Promise.all([
          apiRequestJson<MenuOnlineLoyaltyConfigDTO>('/api/v1/tenant/menu-online/loyalty', accessToken),
          apiRequestJson<MenuOnlineCashbackConfigDTO>('/api/v1/tenant/menu-online/cashback', accessToken),
        ]);
        if (cancelled) return;
        setLoyalty(loyaltyData);
        setCashback(cashbackData);

        setLoyaltyEnabled(loyaltyData.enabled);
        setPointsPerCurrency(loyaltyData.pointsPerCurrency);
        setCurrencyPerPoint(loyaltyData.currencyPerPoint);

        setCashbackEnabled(cashbackData.enabled);
        setCashbackPercent(cashbackData.percent);
        setCashbackExpiresDays(cashbackData.expiresDays === null ? '' : String(cashbackData.expiresDays));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar configurações');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const isDirty =
    loyalty !== null &&
    cashback !== null &&
    (loyaltyEnabled !== loyalty.enabled ||
      pointsPerCurrency !== loyalty.pointsPerCurrency ||
      currencyPerPoint !== loyalty.currencyPerPoint ||
      cashbackEnabled !== cashback.enabled ||
      cashbackPercent !== cashback.percent ||
      (cashbackExpiresDays.trim() === '' ? null : Number(cashbackExpiresDays)) !== cashback.expiresDays);

  async function save(): Promise<void> {
    if (!accessToken) return;
    setIsSaving(true);
    setError('');
    try {
      const loyaltyPayload: MenuOnlineUpdateLoyaltyConfigRequest = {
        enabled: loyaltyEnabled,
        pointsPerCurrency,
        currencyPerPoint,
      };

      const expiresDaysTrim = cashbackExpiresDays.trim();
      const cashbackPayload: MenuOnlineUpdateCashbackConfigRequest = {
        enabled: cashbackEnabled,
        percent: cashbackPercent,
        expiresDays: expiresDaysTrim === '' ? null : Number(expiresDaysTrim),
      };

      const [nextLoyalty, nextCashback] = await Promise.all([
        apiRequestJson<MenuOnlineLoyaltyConfigDTO>('/api/v1/tenant/menu-online/loyalty', accessToken, {
          method: 'PATCH',
          body: JSON.stringify(loyaltyPayload),
        }),
        apiRequestJson<MenuOnlineCashbackConfigDTO>('/api/v1/tenant/menu-online/cashback', accessToken, {
          method: 'PATCH',
          body: JSON.stringify(cashbackPayload),
        }),
      ]);

      setLoyalty(nextLoyalty);
      setCashback(nextCashback);
      toast({ title: 'Configurações salvas' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar configurações';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    } finally {
      setIsSaving(false);
    }
  }

  if (!accessToken) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-6 pb-4"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Fidelidade & Cashback</h1>
        <p className="text-muted-foreground">Configurações por tenant</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fidelidade</CardTitle>
              <CardDescription>Pontos por valor gasto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Ativar</div>
                  <div className="text-sm text-muted-foreground">Habilita cálculo de pontos</div>
                </div>
                <input
                  type="checkbox"
                  checked={loyaltyEnabled}
                  onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Pontos por moeda (ex: 1 ponto a cada R$ 10 = 0.1)</Label>
                <Input type="number" value={pointsPerCurrency} onChange={(e) => setPointsPerCurrency(Number(e.target.value))} />
              </div>

              <div className="space-y-2">
                <Label>Moeda por ponto (ex: 1 ponto vale R$ 0.50)</Label>
                <Input type="number" value={currencyPerPoint} onChange={(e) => setCurrencyPerPoint(Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cashback</CardTitle>
              <CardDescription>Percentual configurável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Ativar</div>
                  <div className="text-sm text-muted-foreground">Habilita cálculo de cashback</div>
                </div>
                <input
                  type="checkbox"
                  checked={cashbackEnabled}
                  onChange={(e) => setCashbackEnabled(e.target.checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Percentual</Label>
                <Input type="number" value={cashbackPercent} onChange={(e) => setCashbackPercent(Number(e.target.value))} />
              </div>

              <div className="space-y-2">
                <Label>Expira em (dias) — vazio = não expira</Label>
                <Input value={cashbackExpiresDays} onChange={(e) => setCashbackExpiresDays(e.target.value)} placeholder="Ex: 30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loyalty && cashback && isDirty && (
        <FormFooterSaveBar
          isLoading={isSaving}
          primaryLabel="Salvar"
          showCancel
          cancelLabel="Cancelar"
          onCancel={() => {
            setLoyaltyEnabled(loyalty.enabled);
            setPointsPerCurrency(loyalty.pointsPerCurrency);
            setCurrencyPerPoint(loyalty.currencyPerPoint);
            setCashbackEnabled(cashback.enabled);
            setCashbackPercent(cashback.percent);
            setCashbackExpiresDays(cashback.expiresDays === null ? '' : String(cashback.expiresDays));
          }}
        />
      )}

      {!isDirty && loyalty && cashback && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoyaltyEnabled(loyalty.enabled);
              setPointsPerCurrency(loyalty.pointsPerCurrency);
              setCurrencyPerPoint(loyalty.currencyPerPoint);
              setCashbackEnabled(cashback.enabled);
              setCashbackPercent(cashback.percent);
              setCashbackExpiresDays(cashback.expiresDays === null ? '' : String(cashback.expiresDays));
            }}
          >
            Recarregar valores
          </Button>
        </div>
      )}
    </form>
  );
}

export const MenuOnlineRewardsPage = withModuleGuard(MenuOnlineRewardsPageContent, 'menu-online');

