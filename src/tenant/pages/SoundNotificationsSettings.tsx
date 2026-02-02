'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/menu-online';
import {
  SOUND_NOTIFICATION_EVENTS,
  SOUND_NOTIFICATION_USER_ROLES,
  type SoundNotificationSettingsDTO,
  type SoundNotificationUpsertSettingsRequest,
  type SoundNotificationUpdateSettingRequest,
  type SoundNotificationUserRole,
} from '@/src/types/sound-notifications';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isSoundNotificationUserRole(value: string): value is SoundNotificationUserRole {
  return Object.values(SOUND_NOTIFICATION_USER_ROLES).some((v) => v === value);
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

type PageState = {
  enabled: boolean;
  soundKey: string;
  volume: number;
};

function SoundNotificationsSettingsPageContent() {
  const { accessToken, user } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [original, setOriginal] = useState<SoundNotificationSettingsDTO | null>(null);
  const [state, setState] = useState<PageState>({ enabled: true, soundKey: 'ding', volume: 0.8 });

  const currentRole: SoundNotificationUserRole | null = useMemo(() => {
    if (!user?.role) return null;
    return isSoundNotificationUserRole(user.role) ? user.role : null;
  }, [user?.role]);

  useEffect(() => {
    if (!accessToken) return;
    if (!currentRole) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const list = await apiRequestJson<SoundNotificationSettingsDTO[]>(
          '/api/v1/tenant/sound-notifications/settings',
          accessToken,
        );
        if (cancelled) return;

        const match =
          list.find(
            (s) =>
              s.userRole === currentRole && s.event === SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
          ) ?? null;

        setOriginal(match);
        setState({
          enabled: match?.enabled ?? true,
          soundKey: match?.soundKey ?? 'ding',
          volume: match?.volume ?? 0.8,
        });
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
  }, [accessToken, currentRole]);

  async function save(): Promise<void> {
    if (!accessToken) return;
    if (!currentRole) {
      setError('Role inválida para configurar notificações');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (original) {
        const payload: SoundNotificationUpdateSettingRequest = {
          enabled: state.enabled,
          soundKey: state.soundKey.trim(),
          volume: state.volume,
        };
        const updated = await apiRequestJson<SoundNotificationSettingsDTO>(
          `/api/v1/tenant/sound-notifications/settings/${original.id}`,
          accessToken,
          { method: 'PATCH', body: JSON.stringify(payload) },
        );
        setOriginal(updated);
      } else {
        const payload: SoundNotificationUpsertSettingsRequest = {
          settings: [
            {
              userRole: currentRole,
              event: SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
              enabled: state.enabled,
              soundKey: state.soundKey.trim(),
              volume: state.volume,
            },
          ],
        };
        const updated = await apiRequestJson<SoundNotificationSettingsDTO[]>(
          '/api/v1/tenant/sound-notifications/settings',
          accessToken,
          { method: 'PUT', body: JSON.stringify(payload) },
        );
        const match =
          updated.find(
            (s) =>
              s.userRole === currentRole && s.event === SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
          ) ?? null;
        setOriginal(match);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="notifications.manage">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notificações Sonoras</h1>
          <p className="text-muted-foreground">Configurações por papel do usuário</p>
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
              <CardTitle>Novo pedido</CardTitle>
              <CardDescription>Dispara quando um pedido é criado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Ativar som</div>
                  <div className="text-sm text-muted-foreground">
                    Toca um beep quando chega pedido
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={state.enabled}
                  onChange={(e) => setState((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Som</Label>
                <Input
                  value={state.soundKey}
                  onChange={(e) => setState((prev) => ({ ...prev, soundKey: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Volume (0 a 1)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={String(state.volume)}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setState((prev) => ({ ...prev, volume: Number.isFinite(n) ? n : prev.volume }));
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button disabled={isSaving} onClick={() => void save()}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={() =>
                    setState({
                      enabled: original?.enabled ?? true,
                      soundKey: original?.soundKey ?? 'ding',
                      volume: original?.volume ?? 0.8,
                    })
                  }
                >
                  Reverter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}

export const SoundNotificationsSettingsPage = withModuleGuard(
  SoundNotificationsSettingsPageContent,
  'sound-notifications',
);
