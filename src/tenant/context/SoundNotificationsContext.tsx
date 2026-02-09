'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { REALTIME_ORDER_EVENTS, REALTIME_PAYMENT_EVENTS } from '@/src/core/realtime/contracts';
import {
  connectTenantRealtimeSocket,
  createRealtimeDeduper,
  subscribeRealtimeEvent,
} from '@/src/tenant/lib/realtimeClient';
import {
  SOUND_NOTIFICATION_EVENTS,
  SOUND_NOTIFICATION_USER_ROLES,
  type SoundNotificationEventId,
  type SoundNotificationSettingsDTO,
  type SoundNotificationUserRole,
} from '@/src/types/sound-notifications';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/menu-online';

type SettingsByEvent = Record<SoundNotificationEventId, SoundNotificationSettingsDTO | null>;

type SoundNotificationsContextValue = {
  refreshSettings: () => Promise<void>;
};

const SoundNotificationsContext = createContext<SoundNotificationsContextValue | undefined>(undefined);

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

async function apiGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const standard = window.AudioContext;
  if (typeof standard === 'function') return new standard();

  const webkit = (window as unknown as { webkitAudioContext?: new () => AudioContext }).webkitAudioContext;
  if (typeof webkit === 'function') return new webkit();

  return null;
}

function playTone(audioContext: AudioContext, frequency: number, volume: number): void {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Math.max(0, Math.min(1, volume));
  gainNode.connect(audioContext.destination);

  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);

  const now = audioContext.currentTime;
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}

function playSoundForEvent(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  setting: SoundNotificationSettingsDTO | null,
): void {
  if (!setting || !setting.enabled) return;

  if (!audioContextRef.current) {
    audioContextRef.current = createAudioContext();
  }
  const ctx = audioContextRef.current;
  if (!ctx) return;

  const freq = getSoundFrequency(setting.soundKey);
  playTone(ctx, freq, setting.volume);
}

function getSoundFrequency(soundKey: string): number {
  if (soundKey === 'ding') return 880;
  if (soundKey === 'chime') return 660;
  return 440;
}

export function SoundNotificationsProvider({ children }: { children: ReactNode }) {
  const { accessToken, tenantId, user, isModuleEnabled } = useSession();
  const [settings, setSettings] = useState<SoundNotificationSettingsDTO[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<ReturnType<typeof connectTenantRealtimeSocket> | null>(null);
  const deduperRef = useRef(createRealtimeDeduper(300));

  const currentRole: SoundNotificationUserRole | null = useMemo(() => {
    if (!user?.role) return null;
    return isSoundNotificationUserRole(user.role) ? user.role : null;
  }, [user?.role]);

  const settingsByEvent: SettingsByEvent = useMemo(() => {
    const base: SettingsByEvent = {
      [SOUND_NOTIFICATION_EVENTS.ORDER_CREATED]: null,
      [SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED]: null,
      [SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED]: null,
    };

    if (!currentRole) return base;
    for (const s of settings) {
      if (s.userRole !== currentRole) continue;
      base[s.event] = s;
    }
    return base;
  }, [settings, currentRole]);

  const refreshSettings = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    const data = await apiGet<SoundNotificationSettingsDTO[]>('/api/v1/tenant/sound-notifications/settings', accessToken);
    setSettings(data);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    if (!isModuleEnabled('sound-notifications')) return;
    void refreshSettings();
  }, [accessToken, isModuleEnabled, refreshSettings]);

  useEffect(() => {
    if (!accessToken) return;
    if (!tenantId) return;
    if (!isModuleEnabled('sound-notifications')) return;
    if (!currentRole) return;

    const socket = connectTenantRealtimeSocket(tenantId, accessToken);
    socketRef.current = socket;

    const subscriptions = [
      // Order created event
      subscribeRealtimeEvent(
        socket,
        REALTIME_ORDER_EVENTS.ORDER_CREATED,
        () => {
          playSoundForEvent(audioContextRef, settingsByEvent[SOUND_NOTIFICATION_EVENTS.ORDER_CREATED]);
        },
        deduperRef.current,
      ),
      // Order status changed event
      subscribeRealtimeEvent(
        socket,
        REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED,
        () => {
          playSoundForEvent(audioContextRef, settingsByEvent[SOUND_NOTIFICATION_EVENTS.ORDER_STATUS_CHANGED]);
        },
        deduperRef.current,
      ),
      // Payment confirmed event
      subscribeRealtimeEvent(
        socket,
        REALTIME_PAYMENT_EVENTS.PAYMENT_CONFIRMED,
        () => {
          playSoundForEvent(audioContextRef, settingsByEvent[SOUND_NOTIFICATION_EVENTS.PAYMENT_CONFIRMED]);
        },
        deduperRef.current,
      ),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [accessToken, tenantId, isModuleEnabled, currentRole, settingsByEvent]);

  return (
    <SoundNotificationsContext.Provider value={{ refreshSettings }}>
      {children}
    </SoundNotificationsContext.Provider>
  );
}

export function useSoundNotifications() {
  const ctx = useContext(SoundNotificationsContext);
  if (!ctx) throw new Error('useSoundNotifications must be used within SoundNotificationsProvider');
  return ctx;
}
