'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { MenuOnlineCategoryDTO, MenuOnlineProductDTO, MenuOnlinePublicMenuDTO } from '@/src/types/menu-online';
import { ProductCard } from '@/src/tenant/components/cards';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

export function MenuPublicPage() {
  const params = useParams();
  const tenantSlug = params.slug ?? '';

  const [data, setData] = useState<MenuOnlinePublicMenuDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notFound, setNotFound] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuOnlineProductDTO | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      if (!tenantSlug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setNotFound(false);

      try {
        const response = await fetch(`/api/v1/menu/${encodeURIComponent(tenantSlug)}`);
        const raw: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
            return;
          }
          if (isApiErrorResponse(raw)) {
            setError(raw.message);
            return;
          }
          setError('Falha ao carregar cardápio');
          return;
        }

        if (isApiSuccessResponse<MenuOnlinePublicMenuDTO>(raw)) {
          if (!cancelled) {
            setData(raw.data);
          }
          return;
        }

        if (isRecord(raw) && 'tenant' in raw && 'categories' in raw && 'products' in raw) {
          if (!cancelled) {
            setData(raw as MenuOnlinePublicMenuDTO);
          }
          return;
        }

        setError('Resposta inválida do servidor');
      } catch {
        if (!cancelled) {
          setError('Falha ao carregar cardápio');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const categoriesOrdered = useMemo<MenuOnlineCategoryDTO[]>(() => {
    if (!data) return [];
    return [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const productsByCategory = useMemo<Map<string, MenuOnlineProductDTO[]>>(() => {
    const map = new Map<string, MenuOnlineProductDTO[]>();
    if (!data) return map;
    for (const product of data.products) {
      if (product.status !== 'active') continue;
      const list = map.get(product.categoryId) ?? [];
      list.push(product);
      map.set(product.categoryId, list);
    }
    for (const [categoryId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(categoryId, list);
    }
    return map;
  }, [data]);

  const hasActiveProducts = useMemo<boolean>(() => {
    if (!data) return false;
    return data.products.some((product) => product.status === 'active');
  }, [data]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Restaurante não encontrado</h1>
          <p className="text-muted-foreground">
            Verifique o endereço digitado ou entre em contato com o estabelecimento.
          </p>
        </div>
      </div>
    );
  }

  const tenantName = data?.tenant.tradeName ?? 'Restaurante';
  const isOpen = data?.tenant.isOpen ?? false;
  const currency = data?.settings.currency ?? 'BRL';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <header className="border-b bg-gradient-to-b from-background to-muted/30">
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pedidos Online
            </p>
          </div>
          <div className="space-y-3.5 px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {tenantName.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-bold leading-tight text-foreground">
                  {tenantName}
                </h1>
                {data?.tenant.address.city && data.tenant.address.state && (
                  <p className="text-xs text-muted-foreground">
                    {data.tenant.address.city} - {data.tenant.address.state}
                  </p>
                )}
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                isOpen
                  ? 'border-success/20 bg-success-soft text-success'
                  : 'border-danger/20 bg-danger-soft text-danger'
              }
            >
              <span
                className={
                  isOpen
                    ? 'mr-1.5 h-1.5 w-1.5 rounded-full bg-success'
                    : 'mr-1.5 h-1.5 w-1.5 rounded-full bg-danger'
                }
              />
              {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
            </Badge>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="text-sm text-muted-foreground">Carregando cardápio...</div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Loja</div>
                    <div className="font-medium">{tenantName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {isOpen ? 'Aberta para pedidos' : 'Fechada no momento'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!hasActiveProducts && (
                <div className="text-sm text-muted-foreground">
                  Nenhum produto disponível no momento. Volte em breve.
                </div>
              )}

              {categoriesOrdered.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nenhuma categoria disponível neste cardápio.
                </div>
              ) : (
                categoriesOrdered.map((category) => {
                  const products = productsByCategory.get(category.id) ?? [];
                  return (
                    <section key={category.id} className="space-y-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold">{category.name}</h2>
                        <span className="text-xs text-muted-foreground">{category.status}</span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      {products.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Nenhum produto nesta categoria.
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {products.map((product) => {
                            const defaultVariation =
                              product.priceVariations.find((v) => v.isDefault) ??
                              product.priceVariations[0] ??
                              null;
                            const mainPrice = defaultVariation
                              ? defaultVariation.price
                              : product.basePrice;
                            const mainPriceLabel = defaultVariation ? defaultVariation.name : null;
                            const firstImage = data.settings.showImages
                              ? product.images[0]?.url ?? null
                              : null;

                            return (
                              <ProductCard
                                key={product.id}
                                variant="preview"
                                name={product.name}
                                description={product.description}
                                price={mainPrice}
                                imageUrl={firstImage}
                                status={product.status}
                                currency={currency}
                                priceLabel={mainPriceLabel ?? undefined}
                                promoPrice={product.promoPrice}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsProductModalOpen(true);
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })
              )}
              {selectedProduct && (
                <BaseModal
                  open={isProductModalOpen}
                  onOpenChange={(open) => {
                    setIsProductModalOpen(open);
                    if (!open) {
                      setSelectedProduct(null);
                    }
                  }}
                  size="sm"
                >
                  <ModalHeader title={selectedProduct.name} />
                  <ModalBody className="space-y-3">
                    {selectedProduct.description && (
                      <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button className="w-full" onClick={() => setIsProductModalOpen(false)}>
                      Fechar
                    </Button>
                  </ModalFooter>
                </BaseModal>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MenuPublicPage;

