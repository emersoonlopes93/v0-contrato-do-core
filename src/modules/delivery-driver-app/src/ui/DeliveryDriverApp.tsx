'use client';

import React from 'react';
import { TenantProvider } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DriverSessionProvider } from '../hooks/DriverSessionContext';
import { DeliveryDriverAppPage } from './DeliveryDriverAppPage';

function getTenantSlugFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  if (segments[0] !== 'driver') return null;
  const slug = segments[1]?.trim() ?? '';
  return slug.length > 0 ? slug : null;
}

function DriverTenantEntry() {
  const [slug, setSlug] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = slug.trim();
    if (!trimmed) return;
    window.location.replace(`/driver/${trimmed}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no app do entregador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Slug do tenant</Label>
              <Input
                id="tenant-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="h-11"
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full">
              Acessar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function DeliveryDriverApp() {
  const slug = getTenantSlugFromPath(window.location.pathname);
  if (!slug) {
    return <DriverTenantEntry />;
  }
  return (
    <TenantProvider tenantSlug={slug}>
      <DriverSessionProvider>
        <DeliveryDriverAppPage />
      </DriverSessionProvider>
    </TenantProvider>
  );
}
