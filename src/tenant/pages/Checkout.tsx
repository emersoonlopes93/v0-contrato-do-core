'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MaskedInput } from '@/src/shared/inputs/MaskedInput';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { CheckoutCreateOrderRequest, CheckoutOrderDTO, CheckoutPaymentMethod } from '@/src/types/checkout';
import type { TenantSettingsDTO } from '@/src/types/tenant-settings';
import type { MenuOnlineModifierGroupDTO, MenuOnlineModifierOptionDTO, MenuOnlineProductDTO } from '@/src/types/menu-online';

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

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  variationId: string | null;
  modifierOptionIds: string[];
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function CheckoutPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings: sessionTenantSettings, isModuleEnabled } = useSession();

  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const [modifierGroups, setModifierGroups] = useState<MenuOnlineModifierGroupDTO[]>([]);
  const [modifierOptions, setModifierOptions] = useState<MenuOnlineModifierOptionDTO[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDTO | null>(null);

  const [cart, setCart] = useState<CartItem[]>([{ id: newId(), productId: '', quantity: 1, variationId: null, modifierOptionIds: [] }]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('pix');
  const [deliveryFee, setDeliveryFee] = useState<string>('0');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const [prods, groups, options] = await Promise.all([
          apiRequestJson<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', tenantSlug),
          apiRequestJson<MenuOnlineModifierGroupDTO[]>('/api/v1/tenant/menu-online/modifiers/groups', tenantSlug),
          apiRequestJson<MenuOnlineModifierOptionDTO[]>('/api/v1/tenant/menu-online/modifiers/options', tenantSlug),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setModifierGroups(groups);
        setModifierOptions(options);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar dados do cardápio');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isModuleEnabled('settings')) {
          if (!cancelled) setTenantSettings(null);
          return;
        }
        const settings = await apiRequestJson<TenantSettingsDTO | null>('/api/v1/tenant/settings', tenantSlug);
        if (!cancelled) setTenantSettings(settings);
      } catch {
        if (!cancelled) setTenantSettings(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isModuleEnabled, tenantSlug]);

  const productById = useMemo(() => {
    const map = new Map<string, MenuOnlineProductDTO>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const modifierGroupById = useMemo(() => {
    const map = new Map<string, MenuOnlineModifierGroupDTO>();
    for (const g of modifierGroups) map.set(g.id, g);
    return map;
  }, [modifierGroups]);

  const modifierOptionsByGroupId = useMemo(() => {
    const map = new Map<string, MenuOnlineModifierOptionDTO[]>();
    for (const o of modifierOptions) {
      const list = map.get(o.groupId) ?? [];
      list.push(o);
      map.set(o.groupId, list);
    }
    for (const [groupId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(groupId, list);
    }
    return map;
  }, [modifierOptions]);

  const currency = tenantSettings?.currency ?? 'BRL';

  const deliveryFeeNumber = useMemo(() => {
    const n = Number(deliveryFee);
    return Number.isFinite(n) ? n / 100 : 0;
  }, [deliveryFee]);

  const derived = useMemo(() => {
    const lines = cart
      .filter((i) => i.productId.trim() !== '')
      .map((i) => {
        const product = productById.get(i.productId) ?? null;
        const variation =
          product && i.variationId
            ? product.priceVariations.find((v) => v.id === i.variationId) ?? null
            : null;
        const basePrice = variation ? variation.price : product?.basePrice ?? 0;
        const selectedOptions = i.modifierOptionIds
          .map((id) => modifierOptions.find((o) => o.id === id))
          .filter((o): o is MenuOnlineModifierOptionDTO => !!o);
        const modifiersTotal = selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
        const unitPrice = basePrice + modifiersTotal;
        const totalPrice = unitPrice * i.quantity;
        return { item: i, product, variation, selectedOptions, unitPrice, totalPrice };
      });

    const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
    const total = subtotal + deliveryFeeNumber;
    return { lines, subtotal, total };
  }, [cart, productById, modifierOptions, deliveryFeeNumber]);

  const basePath = `/tenant/${tenantSlug}`;

  const hasMinimumTenantSettings =
    tenantSettings !== null &&
    tenantSettings.addressStreet !== null &&
    tenantSettings.addressStreet.trim() !== '' &&
    tenantSettings.addressCity !== null &&
    tenantSettings.addressCity.trim() !== '' &&
    tenantSettings.addressState !== null &&
    tenantSettings.addressState.trim() !== '';

  const hasMinimumSessionSettings =
    sessionTenantSettings !== null &&
    sessionTenantSettings.city !== null &&
    sessionTenantSettings.state !== null;

  const canCheckout = hasMinimumTenantSettings && hasMinimumSessionSettings;

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    setError('');

    try {
      if (!canCheckout) {
        throw new Error('Tenant settings incompletas');
      }
      if (derived.lines.length === 0) {
        throw new Error('Carrinho vazio');
      }
      if (customerName.trim() === '' || customerPhone.trim() === '') {
        throw new Error('Dados do cliente obrigatórios');
      }

      const payload: CheckoutCreateOrderRequest = {
        items: derived.lines.map((l) => ({
          productId: l.item.productId,
          quantity: l.item.quantity,
          unitPrice: l.unitPrice,
          totalPrice: l.totalPrice,
          variation: l.variation
            ? { id: l.variation.id, name: l.variation.name, price: l.variation.price }
            : null,
          modifiers: l.selectedOptions.map((o) => ({
            id: o.id,
            name: o.name,
            priceDelta: o.priceDelta,
            quantity: 1,
          })),
        })),
        subtotal: derived.subtotal,
        deliveryFee: deliveryFeeNumber,
        total: derived.total,
        paymentMethod,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
      };

      const order = await apiRequestJson<CheckoutOrderDTO>('/api/v1/checkout', tenantSlug, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      window.location.href = `${basePath}/payments/${order.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no checkout');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PermissionGuard permission="checkout:create">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
          <p className="text-muted-foreground">Criar pedido com snapshot de preços</p>
        </div>

        {!canCheckout && (
          <Alert variant="destructive">
            <AlertDescription>
              Checkout bloqueado: preencha Configurações da Loja (endereço, cidade, estado).{' '}
              <a href={`${basePath}/settings`} className="underline underline-offset-4">
                Abrir
              </a>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Carrinho</CardTitle>
                <CardDescription>Itens do pedido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item, idx) => {
                  const product = item.productId ? productById.get(item.productId) ?? null : null;
                  const availableVariations = (product?.priceVariations ?? []).filter((v) => v.status === 'active');
                  const productModifierGroups = product?.modifierGroupIds ?? [];
                  return (
                    <div key={item.id} className="rounded-lg border p-3 space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Produto</Label>
                          <select
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={item.productId}
                            onChange={(e) => {
                              const nextProductId = e.target.value;
                              setCart((prev) =>
                                prev.map((x) =>
                                  x.id === item.id
                                    ? { ...x, productId: nextProductId, variationId: null, modifierOptionIds: [] }
                                    : x,
                                ),
                              );
                            }}
                          >
                            <option value="">Selecione...</option>
                            {products
                              .filter((p) => p.status === 'active')
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Qtd</Label>
                          <Input
                            type="number"
                            min={1}
                            value={String(item.quantity)}
                            onChange={(e) => {
                              const nextQty = Number(e.target.value);
                              setCart((prev) =>
                                prev.map((x) =>
                                  x.id === item.id ? { ...x, quantity: Number.isNaN(nextQty) ? 1 : Math.max(1, nextQty) } : x,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>

                      {product && availableVariations.length > 0 && (
                        <div className="space-y-2">
                          <Label>Variação</Label>
                          <select
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={item.variationId ?? ''}
                            onChange={(e) => {
                              const nextVariationId = e.target.value.trim() === '' ? null : e.target.value;
                              setCart((prev) => prev.map((x) => (x.id === item.id ? { ...x, variationId: nextVariationId } : x)));
                            }}
                          >
                            <option value="">Padrão</option>
                            {availableVariations.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {product && productModifierGroups.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Complementos</div>
                          {productModifierGroups.map((groupId) => {
                            const group = modifierGroupById.get(groupId) ?? null;
                            const options = modifierOptionsByGroupId.get(groupId) ?? [];
                            if (!group) return null;
                            return (
                              <div key={groupId} className="space-y-2 rounded-md border p-3">
                                <div className="text-sm font-medium">{group.name}</div>
                                <div className="grid gap-2 md:grid-cols-2">
                                  {options
                                    .filter((o) => o.status === 'active')
                                    .map((o) => {
                                      const checked = item.modifierOptionIds.includes(o.id);
                                      return (
                                        <label key={o.id} className="flex items-center gap-2 text-sm">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              const nextChecked = e.target.checked;
                                              setCart((prev) =>
                                                prev.map((x) => {
                                                  if (x.id !== item.id) return x;
                                                  const set = new Set(x.modifierOptionIds);
                                                  if (nextChecked) set.add(o.id);
                                                  else set.delete(o.id);
                                                  return { ...x, modifierOptionIds: Array.from(set) };
                                                }),
                                              );
                                            }}
                                          />
                                          <span className="flex-1">{o.name}</span>
                                          <span className="text-muted-foreground">{formatCurrency(o.priceDelta, currency)}</span>
                                        </label>
                                      );
                                    })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Item #{idx + 1}</span>
                        <Button
                          variant="outline"
                          onClick={() => setCart((prev) => prev.filter((x) => x.id !== item.id))}
                          disabled={cart.length <= 1}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCart((prev) => [...prev, { id: newId(), productId: '', quantity: 1, variationId: null, modifierOptionIds: [] }])}>
                    Adicionar item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                  <CardDescription>Dados obrigatórios para o pedido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <MaskedInput
                      type="phone"
                      value={customerPhone}
                      onChange={(raw) => setCustomerPhone(typeof raw === 'string' ? raw : String(raw))}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pagamento</CardTitle>
                  <CardDescription>Somente seleção do método</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(['pix', 'card', 'cash'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="paymentMethod" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>Totais enviados no checkout (snapshot)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(derived.subtotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Taxa de entrega</span>
                    <div className="w-32">
                      <MaskedInput
                        type="currency"
                        value={deliveryFee}
                        onChange={(raw) => {
                          const cents = typeof raw === 'number' ? raw : Number(String(raw).replace(/\D/g, ''));
                          setDeliveryFee(String(Math.round(cents)));
                        }}
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span>Total</span>
                    <span className="font-medium">{formatCurrency(derived.total, currency)}</span>
                  </div>
                  <Button disabled={isSubmitting || !canCheckout} onClick={() => void submit()} className="w-full">
                    {isSubmitting ? 'Enviando...' : 'Finalizar Pedido'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const CheckoutPage = withModuleGuard(CheckoutPageContent, 'checkout');
