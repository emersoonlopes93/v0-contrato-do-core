'use client';

import React, { useEffect, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineSettingsDTO,
  MenuOnlineUpdateSettingsRequest,
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

function MenuOnlineSettingsPageContent() {
  const { accessToken } = useSession();
  const [settings, setSettings] = useState<MenuOnlineSettingsDTO | null>(null);
  const [currency, setCurrency] = useState<string>('BRL');
  const [showOutOfStock, setShowOutOfStock] = useState<boolean>(false);
  const [showImages, setShowImages] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequestJson<MenuOnlineSettingsDTO>(
          '/api/v1/tenant/menu-online/settings',
          accessToken,
        );
        if (cancelled) return;
        setSettings(data);
        setCurrency(data.currency);
        setShowOutOfStock(data.showOutOfStock);
        setShowImages(data.showImages);
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

  async function save(): Promise<void> {
    if (!accessToken) return;
    setIsSaving(true);
    setError('');
    try {
      const payload: MenuOnlineUpdateSettingsRequest = {
        currency: currency.trim() === '' ? undefined : currency.trim(),
        showOutOfStock,
        showImages,
      };
      const data = await apiRequestJson<MenuOnlineSettingsDTO>(
        '/api/v1/tenant/menu-online/settings',
        accessToken,
        { method: 'PUT', body: JSON.stringify(payload) },
      );
      setSettings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="menu.manage">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
          <p className="text-muted-foreground">Preferências do cardápio do tenant</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Menu Settings</CardTitle>
              <CardDescription>Aplicadas no preview interno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Exibir itens fora de estoque</div>
                  <div className="text-sm text-muted-foreground">Controle visual no cardápio</div>
                </div>
                <input
                  type="checkbox"
                  checked={showOutOfStock}
                  onChange={(e) => setShowOutOfStock(e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Exibir imagens</div>
                  <div className="text-sm text-muted-foreground">Controla imagens no preview</div>
                </div>
                <input
                  type="checkbox"
                  checked={showImages}
                  onChange={(e) => setShowImages(e.target.checked)}
                />
              </div>

              <div className="flex gap-2">
                <Button disabled={isSaving} onClick={() => void save()}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                {settings && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrency(settings.currency);
                      setShowOutOfStock(settings.showOutOfStock);
                      setShowImages(settings.showImages);
                    }}
                  >
                    Reverter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}

export const MenuOnlineSettingsPage = withModuleGuard(MenuOnlineSettingsPageContent, 'menu-online');

