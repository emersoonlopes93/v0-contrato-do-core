import React from 'react';

interface SessionData {
  user?: { id: string; email: string; role: string };
}

const ADMIN_ACCESS_TOKEN_KEY = 'saas_admin_access_token';
const ADMIN_REFRESH_TOKEN_KEY = 'saas_admin_refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'auth_token';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function decodeJwtExpMs(token: string): number | null {
  try {
    const payloadRaw = token.split('.')[1];
    if (!payloadRaw) return null;
    const json = JSON.parse(atob(payloadRaw)) as { exp?: unknown };
    if (typeof json.exp !== 'number') return null;
    return json.exp * 1000;
  } catch {
    return null;
  }
}

export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    let token =
      localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) ??
      localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (!token) {
      window.location.replace('/login/admin');
      return;
    }
    (async () => {
      try {
        const verify = async (accessToken: string): Promise<boolean> => {
          const res = await fetch('/api/v1/auth/session', {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data: SessionData = await res.json().catch(() => ({} as SessionData));
          return res.ok && data.user?.role === 'SAAS_ADMIN';
        };

        const refresh = async (): Promise<string | null> => {
          const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
          if (!refreshToken) return null;
          const res = await fetch('/api/v1/auth/saas-admin/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const raw: unknown = await res.json().catch(() => null);
          if (!res.ok || !isRecord(raw) || !isString(raw.accessToken)) return null;
          localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, raw.accessToken);
          return raw.accessToken;
        };

        if (await verify(token)) {
          setAuthorized(true);
          return;
        }

        const refreshed = await refresh();
        if (refreshed && (await verify(refreshed))) {
          token = refreshed;
          setAuthorized(true);
          return;
        }

        window.location.replace('/login/admin');
      } catch {
        window.location.replace('/login/admin');
      } finally {
        setLoading(false);
      }
    })();

    const shouldRefreshSoon = () => {
      const expMs = token ? decodeJwtExpMs(token) : null;
      if (!expMs) return false;
      return expMs - Date.now() <= 60 * 1000;
    };

    const tick = async () => {
      if (!token) return;
      if (!shouldRefreshSoon()) return;
      const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
      if (!refreshToken) return;
      const res = await fetch('/api/v1/auth/saas-admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const raw: unknown = await res.json().catch(() => null);
      if (!res.ok || !isRecord(raw) || !isString(raw.accessToken)) return;
      token = raw.accessToken;
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 15 * 1000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Verificando sessão...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
