'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PublicLoginRequest, PublicLoginResponse } from '@/src/types/public-auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parsePublicLoginResponse(value: unknown): PublicLoginResponse {
  if (!isRecord(value)) throw new Error('Resposta inválida');
  const ok = value.ok;
  const user = value.user;
  const tenant = value.tenant;
  if (ok !== true) throw new Error('Resposta inválida');
  if (!isRecord(user) || !isRecord(tenant)) throw new Error('Resposta inválida');
  if (!isString(user.id) || !isString(user.email) || !isString(user.role)) throw new Error('Resposta inválida');
  if (!isString(tenant.id) || !isString(tenant.slug) || !isString(tenant.name)) throw new Error('Resposta inválida');
  const permissionsRaw = user.permissions;
  const permissions: string[] = Array.isArray(permissionsRaw)
    ? permissionsRaw.filter((p): p is string => typeof p === 'string')
    : [];
  const nameRaw = user.name;
  const name = typeof nameRaw === 'string' ? nameRaw : null;
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions,
      name,
    },
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
  };
}

function parseSessionTenantSlug(value: unknown): string {
  if (!isRecord(value)) throw new Error('Sessão inválida');
  const tenant = value.tenant;
  if (!isRecord(tenant) || !isString(tenant.slug) || tenant.slug.trim().length === 0) {
    throw new Error('Sessão inválida');
  }
  return tenant.slug.trim();
}

export function GlobalTenantLoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload: PublicLoginRequest = { email, password };

      const response = await fetch('/api/v1/public/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (isRecord(raw) && isString(raw.error)) {
          throw new Error(raw.error);
        }
        throw new Error('Erro ao fazer login');
      }

      const login = parsePublicLoginResponse(raw);

      const sessionRes = await fetch('/api/v1/auth/session', {
        credentials: 'include',
        headers: {
          'X-Auth-Context': 'tenant_user',
          'X-Tenant-Slug': login.tenant.slug,
        },
      });
      
      if (!sessionRes.ok) {
        const sessionRaw: unknown = await sessionRes.json().catch(() => null);
        if (isRecord(sessionRaw) && isString(sessionRaw.error)) {
          throw new Error(sessionRaw.error);
        }
        throw new Error('Sessão inválida');
      }

      const sessionRaw: unknown = await sessionRes.json().catch(() => null);
      const sessionTenantSlug = parseSessionTenantSlug(sessionRaw);
      window.location.replace(`/tenant/${sessionTenantSlug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
