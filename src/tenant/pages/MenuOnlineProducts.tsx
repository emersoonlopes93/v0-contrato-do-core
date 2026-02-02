'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineCategoryDTO,
  MenuOnlineCreateProductRequest,
  MenuOnlineModifierGroupDTO,
  MenuOnlineProductDTO,
  MenuOnlineStatus,
  MenuOnlineUpdateProductRequest,
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

function parseStatus(value: string): MenuOnlineStatus | undefined {
  if (value === 'active' || value === 'inactive') return value;
  return undefined;
}

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const num = Number(trimmed);
  if (Number.isNaN(num)) return undefined;
  return num;
}

async function apiRequest<T>(
  url: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
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

type DraftVariation = { name: string; price: string; isDefault: boolean; status: MenuOnlineStatus };
type DraftImage = { url: string };

function MenuOnlineProductsPageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken } = useSession();
  const [categories, setCategories] = useState<MenuOnlineCategoryDTO[]>([]);
  const [modifierGroups, setModifierGroups] = useState<MenuOnlineModifierGroupDTO[]>([]);
  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [status, setStatus] = useState<MenuOnlineStatus>('active');
  const [basePrice, setBasePrice] = useState<string>('0');
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [variations, setVariations] = useState<DraftVariation[]>([]);

  const editingItem = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [products, editingId],
  );

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const load = async (): Promise<void> => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    try {
      const [cats, groups, items] = await Promise.all([
        apiRequest<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', accessToken),
        apiRequest<MenuOnlineModifierGroupDTO[]>('/api/v1/tenant/menu-online/modifiers/groups', accessToken),
        apiRequest<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', accessToken),
      ]);
      setCategories(cats);
      setModifierGroups(groups);
      setProducts(items);
      if (!editingId && cats.length > 0 && categoryId === '') {
        setCategoryId(cats[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!editingItem) return;
    setCategoryId(editingItem.categoryId);
    setName(editingItem.name);
    setDescription(editingItem.description ?? '');
    setSortOrder(String(editingItem.sortOrder));
    setStatus(editingItem.status);
    setBasePrice(String(editingItem.basePrice));
    setSelectedModifierGroupIds(editingItem.modifierGroupIds);
    setImages(editingItem.images.map((img) => ({ url: img.url })));
    setVariations(
      editingItem.priceVariations.map((v) => ({
        name: v.name,
        price: String(v.price),
        isDefault: v.isDefault,
        status: v.status,
      })),
    );
  }, [editingItem]);

  const resetForm = (): void => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSortOrder('0');
    setStatus('active');
    setBasePrice('0');
    setSelectedModifierGroupIds([]);
    setImages([]);
    setVariations([]);
    if (categories.length > 0) setCategoryId(categories[0].id);
  };

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!accessToken) return;
    setError('');

    if (name.trim() === '') {
      setError('Nome é obrigatório');
      return;
    }
    if (categoryId.trim() === '') {
      setError('Categoria é obrigatória');
      return;
    }

    const sort = parseNumber(sortOrder);
    if (sortOrder.trim() !== '' && sort === undefined) {
      setError('Ordem inválida');
      return;
    }
    const base = parseNumber(basePrice);
    if (basePrice.trim() !== '' && base === undefined) {
      setError('Preço base inválido');
      return;
    }

    const normalizedImages = images
      .map((img) => img.url.trim())
      .filter((u) => u !== '')
      .map((url, idx) => ({ url, sortOrder: idx }));

    const normalizedVariations = variations
      .map((v, idx) => ({
        name: v.name.trim(),
        price: parseNumber(v.price),
        isDefault: v.isDefault,
        sortOrder: idx,
        status: v.status,
      }))
      .filter((v) => v.name !== '' && v.price !== undefined)
      .map((v) => ({
        name: v.name,
        price: v.price as number,
        isDefault: v.isDefault,
        sortOrder: v.sortOrder,
        status: v.status,
      }));

    try {
      if (editingId) {
        const payload: MenuOnlineUpdateProductRequest = {
          categoryId,
          name: name.trim(),
          description: description.trim() === '' ? null : description,
          sortOrder: sort ?? 0,
          status: parseStatus(status),
          basePrice: base ?? 0,
          modifierGroupIds: selectedModifierGroupIds,
          images: normalizedImages.map((img) => ({ url: img.url, sortOrder: img.sortOrder })),
          priceVariations: normalizedVariations.map((v) => ({
            name: v.name,
            price: v.price,
            isDefault: v.isDefault,
            sortOrder: v.sortOrder,
            status: v.status,
          })),
        };
        await apiRequest<MenuOnlineProductDTO>(
          `/api/v1/tenant/menu-online/products/${editingId}`,
          accessToken,
          { method: 'PUT', body: JSON.stringify(payload) },
        );
      } else {
        const payload: MenuOnlineCreateProductRequest = {
          categoryId,
          name: name.trim(),
          description: description.trim() === '' ? null : description,
          sortOrder: sort ?? 0,
          status: parseStatus(status),
          basePrice: base ?? 0,
          modifierGroupIds: selectedModifierGroupIds,
          images: normalizedImages.map((img) => ({ url: img.url, sortOrder: img.sortOrder })),
          priceVariations: normalizedVariations.map((v) => ({
            name: v.name,
            price: v.price,
            isDefault: v.isDefault,
            sortOrder: v.sortOrder,
            status: v.status,
          })),
        };
        await apiRequest<MenuOnlineProductDTO>(
          '/api/v1/tenant/menu-online/products',
          accessToken,
          { method: 'POST', body: JSON.stringify(payload) },
        );
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!accessToken) return;
    setError('');
    try {
      await apiRequest<boolean>(`/api/v1/tenant/menu-online/products/${id}`, accessToken, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  };

  const toggleGroup = (id: string): void => {
    setSelectedModifierGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!accessToken) return null;

  const basePath = `/tenant/${tenantSlug}`;
  return (
    <PermissionGuard permission="products.manage">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Produtos</h1>
            <p className="text-muted-foreground">Gestão de produtos do cardápio</p>
          </div>
          <a href={`${basePath}/menu-online`} className="text-sm text-primary underline-offset-4 hover:underline">
            Voltar
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
            <CardDescription>Campos obrigatórios: categoria e nome</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <select
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories.length === 0 ? (
                      <option value="">Sem categorias</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Preço base</Label>
                  <Input id="basePrice" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} inputMode="decimal" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem</Label>
                  <Input id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grupos de complementos</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {modifierGroups.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum grupo cadastrado</div>
                  ) : (
                    modifierGroups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedModifierGroupIds.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                        />
                        <span className="truncate">{g.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagens (URL)</Label>
                <div className="space-y-2">
                  {images.map((img, idx) => (
                    <div key={`${idx}`} className="flex gap-2">
                      <Input
                        value={img.url}
                        onChange={(e) => {
                          const next = [...images];
                          next[idx] = { url: e.target.value };
                          setImages(next);
                        }}
                        className="h-11"
                        placeholder="https://..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 bg-transparent"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="h-11 bg-transparent" onClick={() => setImages([...images, { url: '' }])}>
                    Adicionar imagem
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Variações de preço</Label>
                <div className="space-y-2">
                  {variations.map((v, idx) => (
                    <div key={`${idx}`} className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-5 md:items-center">
                      <Input
                        value={v.name}
                        onChange={(e) => {
                          const next = [...variations];
                          next[idx] = { ...v, name: e.target.value };
                          setVariations(next);
                        }}
                        className="h-11 md:col-span-2"
                        placeholder="Nome (ex: P)"
                      />
                      <Input
                        value={v.price}
                        onChange={(e) => {
                          const next = [...variations];
                          next[idx] = { ...v, price: e.target.value };
                          setVariations(next);
                        }}
                        className="h-11"
                        inputMode="decimal"
                        placeholder="Preço"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={v.isDefault}
                          onChange={(e) => {
                            const next = [...variations];
                            next[idx] = { ...v, isDefault: e.target.checked };
                            setVariations(next);
                          }}
                        />
                        Padrão
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 bg-transparent"
                        onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 bg-transparent"
                    onClick={() => setVariations([...variations, { name: '', price: '', isDefault: false, status: 'active' }])}
                  >
                    Adicionar variação
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11" disabled={name.trim() === '' || categoryId.trim() === ''}>
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" className="h-11 bg-transparent" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista</CardTitle>
            <CardDescription>{isLoading ? 'Carregando...' : `${products.length} produtos`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.length === 0 && !isLoading ? (
              <div className="text-sm text-muted-foreground">Nenhum produto cadastrado</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{categoryNameById.get(p.categoryId) ?? p.categoryId}</div>
                      <div className="text-xs text-muted-foreground">R$ {p.basePrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{p.status}</div>
                    </div>
                    {p.description && <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="h-9 bg-transparent" onClick={() => setEditingId(p.id)}>
                      Editar
                    </Button>
                    <Button type="button" variant="destructive" className="h-9" onClick={() => void handleDelete(p.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}

export const MenuOnlineProductsPage = withModuleGuard(MenuOnlineProductsPageContent, 'menu-online');
