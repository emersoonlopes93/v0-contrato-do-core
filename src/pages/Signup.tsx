'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PublicSignupRequest, PublicSignupResponse } from '@/src/types/public-auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parsePublicSignupResponse(value: unknown): PublicSignupResponse {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida');
  }

  if (typeof value.success !== 'boolean') {
    throw new Error('Resposta inválida');
  }

  const tenant = value.tenant;
  const user = value.user;

  if (!isRecord(tenant) || !isRecord(user)) {
    throw new Error('Resposta inválida');
  }

  if (!isString(tenant.id) || !isString(tenant.slug) || !isString(tenant.name)) {
    throw new Error('Resposta inválida');
  }

  if (!isString(user.id) || !isString(user.email) || !isString(user.role)) {
    throw new Error('Resposta inválida');
  }

  return {
    success: value.success,
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export function PublicSignupPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantSlug, setTenantSlug] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload: PublicSignupRequest = {
        email,
        password,
        tenantName,
        tenantSlug,
      };

      const response = await fetch('/api/v1/public/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (isRecord(raw) && isString(raw.message)) {
          throw new Error(raw.message);
        }
        throw new Error('Erro ao criar conta');
      }

      const signup = parsePublicSignupResponse(raw);
      if (!signup.success) {
        throw new Error('Erro ao criar conta');
      }

      window.location.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>Cadastre sua loja para começar a usar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">Nome da loja</Label>
              <Input
                id="tenantName"
                type="text"
                placeholder="Minha Loja"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Slug da loja</Label>
              <Input
                id="tenantSlug"
                type="text"
                placeholder="minha-loja"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                required
                className="h-11"
              />
            </div>
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
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

