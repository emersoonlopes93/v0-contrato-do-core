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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import { GripVertical, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  if (Number.isNaN(num)) return undefined;
  return num;
}

function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '';
  const padded = digits.padStart(3, '0');
  const integer = padded.slice(0, -2);
  const decimals = padded.slice(-2);
  const intNumber = Number(integer);
  const intString = intNumber.toString();
  return `${intString},${decimals}`;
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
type DraftImage = { url: string; file?: File | null; progress?: number };

function MenuOnlineProductsPageContent() {
  const { tenantSlug } = useTenant();
  const { accessToken } = useSession();
  const [categories, setCategories] = useState<MenuOnlineCategoryDTO[]>([]);
  const [modifierGroups, setModifierGroups] = useState<MenuOnlineModifierGroupDTO[]>([]);
  const [products, setProducts] = useState<MenuOnlineProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
    setSuccess('');
    try {
      const [cats, groups, items] = await Promise.all([
        apiRequest<MenuOnlineCategoryDTO[]>('/api/v1/tenant/menu-online/categories', accessToken),
        apiRequest<MenuOnlineModifierGroupDTO[]>('/api/v1/tenant/menu-online/modifiers/groups', accessToken),
        apiRequest<MenuOnlineProductDTO[]>('/api/v1/tenant/menu-online/products', accessToken),
      ]);
      setCategories(cats);
      setModifierGroups(groups);
      const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
      setProducts(sortedItems);
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
    setImages(editingItem.images.map((img) => ({ url: img.url, file: null, progress: 100 })));
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
    setEditingId(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!accessToken) return;
    setError('');
    setSuccess('');
    setIsSaving(true);

    if (name.trim() === '') {
      setError('Nome é obrigatório');
      setIsSaving(false);
      return;
    }
    if (categoryId.trim() === '') {
      setError('Categoria é obrigatória');
      setIsSaving(false);
      return;
    }

    const sort = parseNumber(sortOrder);
    if (sortOrder.trim() !== '' && sort === undefined) {
      setError('Ordem inválida');
      setIsSaving(false);
      return;
    }
    const base = parseNumber(basePrice);
    if (basePrice.trim() !== '' && base === undefined) {
      setError('Preço base inválido');
      setIsSaving(false);
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
        setSuccess('Produto atualizado com sucesso');
        toast({
          title: 'Salvo com sucesso',
          description: 'Produto atualizado com sucesso',
        });
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
        setSuccess('Produto criado com sucesso');
        toast({
          title: 'Salvo com sucesso',
          description: 'Produto criado com sucesso',
        });
      }

      resetForm();
      await load();
      setIsModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar produto';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: message,
      });
    } finally {
      setIsSaving(false);
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

  const handleDragStart = (id: string): void => {
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string): void => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setProducts((prev) => {
      const fromIndex = prev.findIndex((p) => p.id === draggingId);
      const toIndex = prev.findIndex((p) => p.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDrop = async (): Promise<void> => {
    if (!accessToken || !draggingId) {
      setDraggingId(null);
      return;
    }
    setDraggingId(null);
    const next = products.map((p, index) => ({ ...p, sortOrder: index }));
    setProducts(next);
    try {
      await Promise.all(
        next.map((p) =>
          apiRequest<MenuOnlineProductDTO>(
            `/api/v1/tenant/menu-online/products/${p.id}`,
            accessToken,
            {
              method: 'PUT',
              body: JSON.stringify({ sortOrder: p.sortOrder }),
            },
          ),
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reordenar produtos';
      setError(message);
      void load();
    }
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const categoryName = categoryNameById.get(p.categoryId)?.toLowerCase() ?? '';
      const categoryMatch = categoryName.includes(term);
      return nameMatch || categoryMatch;
    });
  }, [products, search, categoryNameById]);

  const handleToggleStatus = async (product: MenuOnlineProductDTO): Promise<void> => {
    if (!accessToken) return;
    const nextStatus: MenuOnlineStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await apiRequest<MenuOnlineProductDTO>(
        `/api/v1/tenant/menu-online/products/${product.id}`,
        accessToken,
        {
          method: 'PUT',
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: err instanceof Error ? err.message : 'Falha ao atualizar status do produto',
      });
    }
  };

  const toggleGroup = (id: string): void => {
    setSelectedModifierGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!accessToken) return null;

  const basePath = `/tenant/${tenantSlug}`;
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="border-b-2 border-primary pb-1 text-sm font-semibold text-primary"
              >
                Produtos
              </button>
              <a
                href={`${basePath}/menu-online/modifiers`}
                className="pb-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Complementos
              </a>
            </div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Cardápio</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-9 border-danger/40 text-danger hover:bg-danger/5"
            >
              Remover desconto
            </Button>
            <Button
              variant="default"
              className="h-9"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              + Novo produto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Produtos</CardTitle>
              <CardDescription>Organize visualmente os itens do cardápio</CardDescription>
            </div>
            <div className="flex w-full max-w-xs items-center gap-2 md:w-auto">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 && !isLoading ? (
              <div className="text-sm text-muted-foreground">Nenhum produto cadastrado</div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const imageUrl = p.images[0]?.url ?? '';
                  const hasPromo = p.promoPrice !== null;
                  const oldPrice = p.promoPrice !== null ? p.basePrice : null;
                  const currentPrice = p.promoPrice ?? p.basePrice;

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm md:flex-row md:items-center"
                      draggable
                      onDragStart={() => handleDragStart(p.id)}
                      onDragOver={(e) => handleDragOver(e, p.id)}
                      onDrop={() => void handleDrop()}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex h-10 w-6 flex-col items-center justify-center text-muted-foreground"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={p.status === 'active'}
                              onCheckedChange={() => void handleToggleStatus(p)}
                            />
                            <span
                              className={
                                p.status === 'active'
                                  ? 'text-xs font-medium text-success'
                                  : 'text-xs text-muted-foreground'
                              }
                            >
                              {p.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <div className="h-12 w-12 overflow-hidden rounded-md bg-muted md:h-14 md:w-14">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                Sem imagem
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {categoryNameById.get(p.categoryId) ?? p.categoryId}
                            </span>
                            {hasPromo && (
                              <Badge className="bg-warning-soft text-warning border-warning/40">
                                Mais pedido
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {oldPrice !== null && (
                              <span className="mr-1 line-through">
                                De R$ {oldPrice.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                            <span className="font-semibold text-success">
                              {oldPrice !== null ? 'por' : 'R$'}{' '}
                              {currentPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 md:mt-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(p.id);
                              setIsModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => void handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <BaseModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}
          size="lg"
        >
          <ModalHeader title={editingId ? 'Editar Produto' : 'Novo Produto'} />
          <ModalBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave();
              }}
              className="space-y-4"
              id="product-form"
            >
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
                  <Input
                    id="basePrice"
                    value={basePrice}
                    onChange={(e) => setBasePrice(formatCurrencyInput(e.target.value))}
                    inputMode="decimal"
                    className="h-11"
                  />
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
                <Label>Imagens do produto</Label>
                <p className="text-xs text-muted-foreground">
                  Envie uma imagem real ou cole um link externo.
                </p>
                <div className="space-y-2">
                  {images.map((img, idx) => (
                    <div key={`${idx}`} className="flex flex-col gap-2 md:flex-row">
                      <div className="flex flex-1 flex-col gap-2 md:flex-row">
                        <Input
                          value={img.url}
                          onChange={(e) => {
                            const next = [...images];
                            next[idx] = { ...next[idx], url: e.target.value };
                            setImages(next);
                          }}
                          className="h-11 md:flex-1"
                          placeholder="https://..."
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          className="h-11 md:w-56"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (!file) return;
                            const reader = new FileReader();
                            const next = [...images];
                            next[idx] = { ...next[idx], file, progress: 0 };
                            setImages(next);
                            reader.onprogress = (ev) => {
                              if (!ev.lengthComputable) return;
                              const percent = Math.round((ev.loaded / ev.total) * 100);
                              setImages((current) => {
                                const copy = [...current];
                                if (!copy[idx]) return current;
                                copy[idx] = { ...copy[idx], progress: percent };
                                return copy;
                              });
                            };
                            reader.onload = () => {
                              const result = reader.result;
                              if (typeof result !== 'string') return;
                              setImages((current) => {
                                const copy = [...current];
                                if (!copy[idx]) return current;
                                copy[idx] = { url: result, file: null, progress: 100 };
                                return copy;
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof img.progress === 'number' && img.progress < 100 && (
                          <div className="flex w-32 items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {img.progress}%
                            </span>
                          </div>
                        )}
                        {img.url && (
                          <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                            <img
                              src={img.url}
                              alt={name || 'Imagem do produto'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 bg-transparent"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 bg-transparent"
                    onClick={() => setImages([...images, { url: '', file: null, progress: 0 }])}
                  >
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
                          next[idx] = { ...v, price: formatCurrencyInput(e.target.value) };
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

              {success && !error && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="product-form"
            variant="default"
            className="h-10"
              disabled={isSaving || name.trim() === '' || categoryId.trim() === ''}
            >
              {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
            </Button>
          </ModalFooter>
        </BaseModal>
      </div>
    </>
  );
}

export const MenuOnlineProductsPage = withModuleGuard(MenuOnlineProductsPageContent, 'menu-online');
