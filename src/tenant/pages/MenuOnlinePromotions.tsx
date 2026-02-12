'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineComboDTO,
  MenuOnlineCreateComboRequest,
  MenuOnlineCreateCouponRequest,
  MenuOnlineCreateUpsellSuggestionRequest,
  MenuOnlineCouponDTO,
  MenuOnlineProductDTO,
  MenuOnlineUpsellSuggestionDTO,
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

async function apiRequestJson<T>(url: string, tenantSlug: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
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

type TabId = 'coupons' | 'combos' | 'upsell';

function MenuOnlinePromotionsPageContent() {
  const { tenantSlug } = useTenant();
  useSession();
  const [tab, setTab] = useState<TabId>('coupons');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [coupons, setCoupons] = useState<MenuOnlineCouponDTO[]>([]);
  const [combos, setCombos] = useState<MenuOnlineComboDTO[]>([]);
  const [upsellSuggestions, setUpsellSuggestions] = useState<MenuOnlineUpsellSuggestionDTO[]>([]);

  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState<number>(10);

  const [comboName, setComboName] = useState('');
  const [comboPricingType, setComboPricingType] = useState<'fixed_price' | 'discount_percent' | 'discount_amount'>(
    'discount_percent',
  );
  const [comboFixedPrice, setComboFixedPrice] = useState<number>(0);
  const [comboDiscountPercent, setComboDiscountPercent] = useState<number>(10);
  const [comboDiscountAmount, setComboDiscountAmount] = useState<number>(5);
  const [comboItems, setComboItems] = useState<Array<{ productId: string; minQty: number; maxQty: number }>>([
    { productId: '', minQty: 1, maxQty: 1 },
  ]);

  const [upsellFromProductId, setUpsellFromProductId] = useState<string>('');
  const [upsellSuggestedProductId, setUpsellSuggestedProductId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [productsData, couponsData, combosData, upsellData] = await Promise.all([
          apiRequestJson<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', tenantSlug),
          apiRequestJson<MenuOnlineCouponDTO[]>('/api/v1/tenant/menu-online/coupons', tenantSlug),
          apiRequestJson<MenuOnlineComboDTO[]>('/api/v1/tenant/menu-online/combos', tenantSlug),
          apiRequestJson<MenuOnlineUpsellSuggestionDTO[]>('/api/v1/tenant/menu-online/upsell-suggestions', tenantSlug),
        ]);
        if (cancelled) return;
        setProducts(productsData);
        setCoupons(couponsData);
        setCombos(combosData);
        setUpsellSuggestions(upsellData);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar promoções');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  async function createCoupon(): Promise<void> {
    setError('');
    try {
      const payload: MenuOnlineCreateCouponRequest = {
        code: couponCode.trim(),
        type: couponType,
        value: couponValue,
        status: 'active',
      };
      const created = await apiRequestJson<MenuOnlineCouponDTO>(
        '/api/v1/tenant/menu-online/coupons',
        tenantSlug,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setCoupons((prev) => [...prev, created]);
      setCouponCode('');
      toast({ title: 'Cupom criado' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar cupom';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  async function deleteCoupon(id: string): Promise<void> {
    setError('');
    try {
      await apiRequestJson<unknown>(`/api/v1/tenant/menu-online/coupons/${id}`, tenantSlug, { method: 'DELETE' });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Cupom removido' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao remover cupom';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  async function createCombo(): Promise<void> {
    setError('');
    try {
      const items = comboItems
        .filter((item) => item.productId.trim().length > 0)
        .map((item, idx) => ({
          productId: item.productId,
          minQty: item.minQty,
          maxQty: item.maxQty,
          sortOrder: idx,
          status: 'active' as const,
        }));

      const payload: MenuOnlineCreateComboRequest = {
        name: comboName.trim(),
        pricingType: comboPricingType,
        fixedPrice: comboPricingType === 'fixed_price' ? comboFixedPrice : null,
        discountPercent: comboPricingType === 'discount_percent' ? comboDiscountPercent : null,
        discountAmount: comboPricingType === 'discount_amount' ? comboDiscountAmount : null,
        status: 'active',
        items,
      };
      const created = await apiRequestJson<MenuOnlineComboDTO>(
        '/api/v1/tenant/menu-online/combos',
        tenantSlug,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setCombos((prev) => [...prev, created]);
      setComboName('');
      setComboItems([{ productId: '', minQty: 1, maxQty: 1 }]);
      toast({ title: 'Combo criado' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar combo';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  async function deleteCombo(id: string): Promise<void> {
    setError('');
    try {
      await apiRequestJson<unknown>(`/api/v1/tenant/menu-online/combos/${id}`, tenantSlug, { method: 'DELETE' });
      setCombos((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Combo removido' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao remover combo';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  async function createUpsell(): Promise<void> {
    setError('');
    try {
      const payload: MenuOnlineCreateUpsellSuggestionRequest = {
        fromProductId: upsellFromProductId.trim() === '' ? null : upsellFromProductId,
        suggestedProductId: upsellSuggestedProductId,
        status: 'active',
      };
      const created = await apiRequestJson<MenuOnlineUpsellSuggestionDTO>(
        '/api/v1/tenant/menu-online/upsell-suggestions',
        tenantSlug,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setUpsellSuggestions((prev) => [...prev, created]);
      setUpsellFromProductId('');
      setUpsellSuggestedProductId('');
      toast({ title: 'Upsell criado' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao criar upsell';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  async function deleteUpsell(id: string): Promise<void> {
    setError('');
    try {
      await apiRequestJson<unknown>(
        `/api/v1/tenant/menu-online/upsell-suggestions/${id}`,
        tenantSlug,
        { method: 'DELETE' },
      );
      setUpsellSuggestions((prev) => prev.filter((u) => u.id !== id));
      toast({ title: 'Upsell removido' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao remover upsell';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Promoções</h1>
        <p className="text-muted-foreground">Cupons, combos e upsell</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === 'coupons' ? 'default' : 'outline'} onClick={() => setTab('coupons')}>
          Cupons
        </Button>
        <Button type="button" variant={tab === 'combos' ? 'default' : 'outline'} onClick={() => setTab('combos')}>
          Combos
        </Button>
        <Button type="button" variant={tab === 'upsell' ? 'default' : 'outline'} onClick={() => setTab('upsell')}>
          Upsell
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : tab === 'coupons' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar cupom</CardTitle>
              <CardDescription>Percentual ou valor fixo</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="EX: BEMVINDO10" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as 'percent' | 'fixed')}
                  className="h-10 w-full rounded-md border bg-background px-3"
                >
                  <option value="percent">Percentual</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={couponValue}
                  onChange={(e) => setCouponValue(Number(e.target.value))}
                />
              </div>
              <div className="md:col-span-3">
                <Button type="button" onClick={() => void createCoupon()} disabled={couponCode.trim() === ''}>
                  Criar cupom
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cupons</CardTitle>
              <CardDescription>{coupons.length} cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {coupons.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum cupom cadastrado</div>
              ) : (
                <div className="space-y-2">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between rounded border p-3">
                      <div className="min-w-0">
                        <div className="font-medium">{coupon.code}</div>
                        <div className="text-sm text-muted-foreground">
                          {coupon.type === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                        </div>
                      </div>
                      <Button type="button" variant="destructive" onClick={() => void deleteCoupon(coupon.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : tab === 'combos' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar combo</CardTitle>
              <CardDescription>Preço fixo ou desconto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={comboName} onChange={(e) => setComboName(e.target.value)} placeholder="Ex: Combo Burger" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de precificação</Label>
                  <select
                    value={comboPricingType}
                    onChange={(e) =>
                      setComboPricingType(
                        e.target.value as 'fixed_price' | 'discount_percent' | 'discount_amount',
                      )
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="discount_percent">Desconto %</option>
                    <option value="discount_amount">Desconto valor</option>
                    <option value="fixed_price">Preço fixo</option>
                  </select>
                </div>
              </div>

              {comboPricingType === 'fixed_price' ? (
                <div className="space-y-2">
                  <Label>Preço fixo</Label>
                  <Input type="number" value={comboFixedPrice} onChange={(e) => setComboFixedPrice(Number(e.target.value))} />
                </div>
              ) : comboPricingType === 'discount_percent' ? (
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    value={comboDiscountPercent}
                    onChange={(e) => setComboDiscountPercent(Number(e.target.value))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Desconto (valor)</Label>
                  <Input
                    type="number"
                    value={comboDiscountAmount}
                    onChange={(e) => setComboDiscountAmount(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Itens</Label>
                <div className="space-y-2">
                  {comboItems.map((item, index) => (
                    <div key={index} className="grid gap-2 rounded border p-3 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Produto</Label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const value = e.target.value;
                            setComboItems((prev) =>
                              prev.map((row, idx) => (idx === index ? { ...row, productId: value } : row)),
                            );
                          }}
                          className="mt-1 h-10 w-full rounded-md border bg-background px-3"
                        >
                          <option value="">Selecione</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Mín</Label>
                        <Input
                          type="number"
                          value={item.minQty}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setComboItems((prev) =>
                              prev.map((row, idx) => (idx === index ? { ...row, minQty: value } : row)),
                            );
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Máx</Label>
                        <Input
                          type="number"
                          value={item.maxQty}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setComboItems((prev) =>
                              prev.map((row, idx) => (idx === index ? { ...row, maxQty: value } : row)),
                            );
                          }}
                        />
                      </div>
                      <div className="md:col-span-4 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setComboItems((prev) => prev.filter((_, idx) => idx !== index))}
                          disabled={comboItems.length <= 1}
                        >
                          Remover item
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComboItems((prev) => [...prev, { productId: '', minQty: 1, maxQty: 1 }])}
                  >
                    Adicionar item
                  </Button>
                </div>
              </div>

              <Button type="button" onClick={() => void createCombo()} disabled={comboName.trim() === ''}>
                Criar combo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Combos</CardTitle>
              <CardDescription>{combos.length} cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {combos.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum combo cadastrado</div>
              ) : (
                <div className="space-y-2">
                  {combos.map((combo) => (
                    <div key={combo.id} className="rounded border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium">{combo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {combo.items.length} item(ns)
                          </div>
                        </div>
                        <Button type="button" variant="destructive" onClick={() => void deleteCombo(combo.id)}>
                          Remover
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {combo.items
                          .map((i) => productsById.get(i.productId)?.name ?? i.productId)
                          .join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar upsell</CardTitle>
              <CardDescription>Sugestões para o checkout (configuração)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Produto origem (opcional)</Label>
                  <select
                    value={upsellFromProductId}
                    onChange={(e) => setUpsellFromProductId(e.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="">Todos</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Produto sugerido</Label>
                  <select
                    value={upsellSuggestedProductId}
                    onChange={(e) => setUpsellSuggestedProductId(e.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  >
                    <option value="">Selecione</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="button" onClick={() => void createUpsell()} disabled={upsellSuggestedProductId === ''}>
                Criar upsell
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upsell</CardTitle>
              <CardDescription>{upsellSuggestions.length} sugestões cadastradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {upsellSuggestions.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhuma sugestão cadastrada</div>
              ) : (
                <div className="space-y-2">
                  {upsellSuggestions.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded border p-3">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {productsById.get(u.suggestedProductId)?.name ?? u.suggestedProductId}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Origem: {u.fromProductId ? productsById.get(u.fromProductId)?.name ?? u.fromProductId : 'Todos'}
                        </div>
                      </div>
                      <Button type="button" variant="destructive" onClick={() => void deleteUpsell(u.id)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export const MenuOnlinePromotionsPage = withModuleGuard(MenuOnlinePromotionsPageContent, 'menu-online');

