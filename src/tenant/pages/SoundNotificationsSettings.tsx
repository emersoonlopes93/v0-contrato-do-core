'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useSoundNotifications } from '@/src/tenant/context/SoundNotificationsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/menu-online';
import {
  SOUND_NOTIFICATION_EVENTS,
  SOUND_NOTIFICATION_USER_ROLES,
  type SoundNotificationEventId,
  type SoundNotificationSettingsDTO,
  type SoundNotificationUpsertSettingInput,
  type SoundNotificationUpsertSettingsRequest,
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

const EVENT_CONFIG = [
  {
    event: SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
    title: 'Novo pedido',
    description: 'Dispara quando um pedido é criado',
    hint: 'Toca um beep quando chega pedido',
  },
  {
    event: SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED,
    title: 'Status do pedido',
    description: 'Dispara quando o status do pedido muda',
    hint: 'Toca um beep ao mudar de etapa',
  },
  {
    event: SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED,
    title: 'Pagamento confirmado',
    description: 'Dispara quando o pagamento é confirmado',
    hint: 'Toca um beep após confirmação',
  },
] as const;

function buildDefaults(
  role: SoundNotificationUserRole,
): Record<SoundNotificationEventId, SoundNotificationUpsertSettingInput> {
  return {
    [SOUND_NOTIFICATION_EVENTS.ORDER_CREATED]: {
      userRole: role,
      event: SOUND_NOTIFICATION_EVENTS.ORDER_CREATED,
      enabled: true,
      soundKey: 'ding',
      volume: 0.8,
    },
    [SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED]: {
      userRole: role,
      event: SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED,
      enabled: true,
      soundKey: 'ding',
      volume: 0.8,
    },
    [SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED]: {
      userRole: role,
      event: SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED,
      enabled: true,
      soundKey: 'ding',
      volume: 0.8,
    },
  };
}

function buildOriginalMap(
  list: SoundNotificationSettingsDTO[],
  role: SoundNotificationUserRole,
): Record<SoundNotificationEventId, SoundNotificationSettingsDTO | null> {
  const base: Record<SoundNotificationEventId, SoundNotificationSettingsDTO | null> = {
    [SOUND_NOTIFICATION_EVENTS.ORDER_CREATED]: null,
    [SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED]: null,
    [SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED]: null,
  };

  for (const s of list) {
    if (s.userRole !== role) continue;
    base[s.event] = s;
  }

  return base;
}

function buildStateFromList(
  list: SoundNotificationSettingsDTO[],
  role: SoundNotificationUserRole,
): Record<SoundNotificationEventId, SoundNotificationUpsertSettingInput> {
  const base = buildDefaults(role);
  for (const s of list) {
    if (s.userRole !== role) continue;
    base[s.event] = {
      userRole: role,
      event: s.event,
      enabled: s.enabled,
      soundKey: s.soundKey,
      volume: s.volume,
    };
  }
  return base;
}

function SoundNotificationsSettingsPageContent() {
  const { accessToken, user } = useSession();
  const { refreshSettings } = useSoundNotifications();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [originalByEvent, setOriginalByEvent] = useState<
    Record<SoundNotificationEventId, SoundNotificationSettingsDTO | null> | null
  >(null);
  const [stateByEvent, setStateByEvent] = useState<
    Record<SoundNotificationEventId, SoundNotificationUpsertSettingInput> | null
  >(null);

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

        setOriginalByEvent(buildOriginalMap(list, currentRole));
        setStateByEvent(buildStateFromList(list, currentRole));
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
      if (!stateByEvent) return;

      const payload: SoundNotificationUpsertSettingsRequest = {
        settings: Object.values(stateByEvent).map((entry) => ({
          ...entry,
          soundKey: entry.soundKey.trim(),
        })),
      };

      const updated = await apiRequestJson<SoundNotificationSettingsDTO[]>(
        '/api/v1/tenant/sound-notifications/settings',
        accessToken,
        { method: 'PUT', body: JSON.stringify(payload) },
      );

      setOriginalByEvent(buildOriginalMap(updated, currentRole));
      setStateByEvent(buildStateFromList(updated, currentRole));
      void refreshSettings();
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

        {isLoading || !stateByEvent ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {EVENT_CONFIG.map((config) => {
              const current = stateByEvent[config.event];
              return (
                <Card key={config.event}>
                  <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Ativar som</div>
                        <div className="text-sm text-muted-foreground">{config.hint}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={current.enabled}
                        onChange={(e) =>
                          setStateByEvent((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              [config.event]: { ...prev[config.event], enabled: e.target.checked },
                            };
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Som</Label>
                      <Input
                        value={current.soundKey}
                        onChange={(e) =>
                          setStateByEvent((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              [config.event]: { ...prev[config.event], soundKey: e.target.value },
                            };
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Volume (0 a 1)</Label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={String(current.volume)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setStateByEvent((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              [config.event]: {
                                ...prev[config.event],
                                volume: Number.isFinite(n) ? n : prev[config.event].volume,
                              },
                            };
                          });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-2">
              <Button disabled={isSaving} onClick={() => void save()}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  if (!originalByEvent || !currentRole) return;
                  setStateByEvent(buildStateFromList(
                    Object.values(originalByEvent).filter(
                      (item): item is SoundNotificationSettingsDTO => item !== null,
                    ),
                    currentRole,
                  ));
                }}
              >
                Reverter
              </Button>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const SoundNotificationsSettingsPage = withModuleGuard(
  SoundNotificationsSettingsPageContent,
  'sound-notifications',
);
