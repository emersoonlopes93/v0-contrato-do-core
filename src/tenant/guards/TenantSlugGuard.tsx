'use client';

import { useEffect } from 'react';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';

type TenantSlugGuardProps = {
  children: React.ReactNode;
};

export function TenantSlugGuard({ children }: TenantSlugGuardProps) {
  const { tenantSlug: urlTenantSlug } = useTenant();
  const { isLoading, user, tenantSlug: sessionTenantSlug, logout } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!sessionTenantSlug) return;
    if (sessionTenantSlug === urlTenantSlug) return;

    logout();
    window.location.replace('/login');
  }, [isLoading, user, sessionTenantSlug, urlTenantSlug, logout]);

  if (isLoading) return null;
  if (!user) return null;
  if (sessionTenantSlug && sessionTenantSlug !== urlTenantSlug) return null;

  return <>{children}</>;
}

