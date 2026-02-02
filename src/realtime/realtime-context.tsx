'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import type { RealtimeClient } from '@/src/realtime/realtime-client';
import { createRealtimeClient } from '@/src/realtime/realtime-client';

type RealtimeContextValue = {
  client: RealtimeClient | null;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, tenantId, accessToken, isLoading, logout } = useSession();
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const lastTenantIdRef = useRef<string | null>(null);
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (client) {
        client.disconnect();
        setClient(null);
      }
      lastTenantIdRef.current = null;
      lastTokenRef.current = null;
      return;
    }
    if (!tenantId || !accessToken) return;

    if (
      lastTenantIdRef.current === tenantId &&
      lastTokenRef.current === accessToken &&
      client
    ) {
      return;
    }

    if (client) {
      client.disconnect();
    }

    try {
      const next = createRealtimeClient(tenantId, accessToken);
      setClient(next);
      lastTenantIdRef.current = tenantId;
      lastTokenRef.current = accessToken;
    } catch {
      logout();
    }
  }, [user, tenantId, accessToken, isLoading, logout]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      client,
    }),
    [client],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return ctx;
}

