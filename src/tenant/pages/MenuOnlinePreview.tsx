'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/src/tenant/components/cards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
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
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<T>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

function MenuOnlinePreviewPageContent() {
  const { accessToken } = useSession();
  const [categories, setCategories] = useState<MenuOnlineCategoryDTO[]>([]);
  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const [settings, setSettings] = useState<MenuOnlineSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [cats, prods, s] = await Promise.all([
          apiGet<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', accessToken),
          apiGet<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', accessToken),
          apiGet<MenuOnlineSettingsDTO>('/api/v1/tenant/menu-online/settings', accessToken),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setProducts(prods);
        setSettings(s);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar preview');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const categoryOrder = useMemo(() => {
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, MenuOnlineProductDTO[]>();
    for (const p of products) {
      const current = map.get(p.categoryId) ?? [];
      current.push(p);
      map.set(p.categoryId, current);
    }
    for (const [catId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(catId, list);
    }
    return map;
  }, [products]);

  const currency = settings?.currency ?? 'BRL';
  const showImages = settings?.showImages ?? true;

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="menu.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Preview do Cardápio</h1>
          <p className="text-muted-foreground">Visualização interna (sem pedido / sem checkout)</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Aplicadas neste preview</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div>Moeda: {currency}</div>
                <div>Imagens: {showImages ? 'Sim' : 'Não'}</div>
              </CardContent>
            </Card>

            {categoryOrder.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</div>
            ) : (
              categoryOrder.map((c) => {
                const list = productsByCategory.get(c.id) ?? [];
                return (
                  <div key={c.id} className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-lg font-semibold">{c.name}</h2>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                    {c.description && <div className="text-sm text-muted-foreground">{c.description}</div>}

                    {list.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Nenhum produto nesta categoria</div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {list.map((p) => {
                          const defaultVariation = p.priceVariations.find((v) => v.isDefault) ?? p.priceVariations[0] ?? null;
                          const mainPrice = defaultVariation ? defaultVariation.price : p.basePrice;
                          const mainPriceLabel = defaultVariation ? defaultVariation.name : null;
                          const firstImage = showImages ? p.images[0]?.url : null;
                          return (
                            <ProductCard
                              key={p.id}
                              variant="preview"
                              name={p.name}
                              description={p.description}
                              price={mainPrice}
                              imageUrl={firstImage}
                              status={p.status}
                              currency={currency}
                              priceLabel={mainPriceLabel ?? undefined}
                              promoPrice={p.promoPrice}
                              onClick={() => {
                                // Poderia abrir modal com detalhes
                                console.log('[v0] Ver detalhes do produto:', p.id);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const MenuOnlinePreviewPage = withModuleGuard(MenuOnlinePreviewPageContent, 'menu-online');

