import React from 'react';

interface SessionData {
  user?: { id: string; email: string; role: string };
}

export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.replace('/login/admin');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/v1/auth/session', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: SessionData = await res.json();
        if (res.ok && data.user?.role === 'SAAS_ADMIN') {
          setAuthorized(true);
        } else {
          window.location.replace('/login/admin');
        }
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
