import React from 'react';

interface SessionData {
  user?: { id: string; email: string; role: string };
}


export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const verify = async (): Promise<boolean> => {
          const res = await fetch('/api/v1/auth/session', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-Auth-Context': 'saas_admin',
            },
          });

          if (!res.ok) {
            return false;
          }

          const data: SessionData = await res.json().catch(() => ({} as SessionData));
          return data.user?.role === 'SAAS_ADMIN';
        };

        const refresh = async (): Promise<boolean> => {
          const res = await fetch('/api/v1/auth/saas-admin/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          return res.ok;
        };

        if (await verify()) {
          setAuthorized(true);
          return;
        }

        const refreshed = await refresh();
        if (refreshed && (await verify())) {
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
