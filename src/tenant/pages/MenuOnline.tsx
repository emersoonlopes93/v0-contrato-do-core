'use client';

import React, { useEffect, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineModifierGroupDTO,
  MenuOnlineProductDTO,
} from '@/src/types/menu-online';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) {
      throw new Error(raw.message);
    }
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) {
    throw new Error('Resposta inválida');
  }

  return raw.data;
}

function MenuOnlinePageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken, tenantSettings } = useSession();
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<{ categories: number; products: number; modifierGroups: number } | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    (async () => {
      setError('');
      try {
        const [categories, products, modifierGroups] = await Promise.all([
          apiGet<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', accessToken),
          apiGet<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', accessToken),
          apiGet<MenuOnlineModifierGroupDTO[]>('/api/v1/tenant/menu-online/modifiers/groups', accessToken),
        ]);
        if (cancelled) return;
        setStats({
          categories: categories.length,
          products: products.length,
          modifierGroups: modifierGroups.length,
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!accessToken) return null;

  const basePath = `/tenant/${tenantSlug}`;
  const showSettingsWarning =
    tenantSettings === null ||
    tenantSettings.tradeName === null ||
    tenantSettings.city === null ||
    tenantSettings.state === null;
  return (
    <PermissionGuard permission="menu.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cardápio Online</h1>
          <p className="text-muted-foreground">Gestão de cardápio digital do tenant</p>
        </div>

        {showSettingsWarning && (
          <Alert>
            <AlertDescription>
              Configurações da loja incompletas. Preencha em{' '}
              <a href={`${basePath}/settings`} className="underline underline-offset-4">
                Configurações
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {stats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Categorias: {stats.categories}</Badge>
            <Badge variant="secondary">Produtos: {stats.products}</Badge>
            <Badge variant="secondary">Complementos: {stats.modifierGroups}</Badge>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Organize o cardápio por seções</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={`${basePath}/menu-online/categories`} className="text-sm text-primary underline-offset-4 hover:underline">
                Gerenciar →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>Cadastre itens e preços</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={`${basePath}/menu-online/products`} className="text-sm text-primary underline-offset-4 hover:underline">
                Gerenciar →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complementos</CardTitle>
              <CardDescription>Grupos e opções (extras, adicionais)</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={`${basePath}/menu-online/modifiers`} className="text-sm text-primary underline-offset-4 hover:underline">
                Gerenciar →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Preferências do cardápio por tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={`${basePath}/menu-online/settings`} className="text-sm text-primary underline-offset-4 hover:underline">
                Abrir →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Visualização interna do cardápio público</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={`${basePath}/menu-online/preview`} className="text-sm text-primary underline-offset-4 hover:underline">
                Abrir →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}

export const MenuOnlinePage = withModuleGuard(MenuOnlinePageContent, 'menu-online');
