'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '../components/ModuleGuard';
import { useSession } from '../context/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  MenuOnlineAvailabilityWindow,
  MenuOnlineCategoryDTO,
  MenuOnlineCreateCategoryRequest,
  MenuOnlineStatus,
  MenuOnlineUpdateCategoryRequest,
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

function parseAvailabilityInput(value: string): MenuOnlineAvailabilityWindow[] | null | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (trimmed === 'null') return null;

  const parsed: unknown = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) {
    throw new Error('Availability precisa ser um array ou null');
  }

  const windows: MenuOnlineAvailabilityWindow[] = [];
  for (const item of parsed) {
    if (!isRecord(item)) continue;
    const days = item.days;
    const start = item.start;
    const end = item.end;
    if (!Array.isArray(days) || typeof start !== 'string' || typeof end !== 'string') continue;
    const normalizedDays = days.filter((d): d is number => typeof d === 'number' && Number.isInteger(d));
    windows.push({ days: normalizedDays, start, end });
  }

  return windows;
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

function MenuOnlineCategoriesPageContent() {
  const { accessToken } = useSession();
  const [items, setItems] = useState<MenuOnlineCategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [status, setStatus] = useState<MenuOnlineStatus>('active');
  const [availabilityJson, setAvailabilityJson] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = useMemo(() => items.find((c) => c.id === editingId) ?? null, [items, editingId]);

  const load = async (): Promise<void> => {
    if (!accessToken) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<MenuOnlineCategoryDTO[]>(
        '/api/v1/tenant/menu-online/categories',
        accessToken,
      );
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!editingItem) return;
    setName(editingItem.name);
    setDescription(editingItem.description ?? '');
    setSortOrder(String(editingItem.sortOrder));
    setStatus(editingItem.status);
    setAvailabilityJson(editingItem.availability ? JSON.stringify(editingItem.availability) : editingItem.availability === null ? 'null' : '');
  }, [editingItem]);

  const handleCreateOrUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!accessToken) return;
    setError('');

    const parsedSort = Number(sortOrder);
    if (Number.isNaN(parsedSort)) {
      setError('Sort order inválido');
      return;
    }

    let availability: MenuOnlineAvailabilityWindow[] | null | undefined;
    try {
      availability = parseAvailabilityInput(availabilityJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability inválida');
      return;
    }

    try {
      if (editingId) {
        const payload: MenuOnlineUpdateCategoryRequest = {
          name: name.trim() === '' ? undefined : name.trim(),
          description: description.trim() === '' ? null : description,
          sortOrder: parsedSort,
          status: parseStatus(status) ?? undefined,
          availability,
        };
        await apiRequest<MenuOnlineCategoryDTO>(
          `/api/v1/tenant/menu-online/categories/${editingId}`,
          accessToken,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
        );
      } else {
        const payload: MenuOnlineCreateCategoryRequest = {
          name: name.trim(),
          description: description.trim() === '' ? null : description,
          sortOrder: parsedSort,
          status: parseStatus(status),
          availability,
        };
        await apiRequest<MenuOnlineCategoryDTO>(
          '/api/v1/tenant/menu-online/categories',
          accessToken,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
        );
      }

      setEditingId(null);
      setName('');
      setDescription('');
      setSortOrder('0');
      setStatus('active');
      setAvailabilityJson('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!accessToken) return;
    setError('');
    try {
      await apiRequest<boolean>(`/api/v1/tenant/menu-online/categories/${id}`, accessToken, { method: 'DELETE' });
      if (editingId === id) setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir categoria');
    }
  };

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="categories.manage">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Categorias</h1>
            <p className="text-muted-foreground">Gestão de categorias do cardápio</p>
          </div>
          <a href="/tenant/menu-online" className="text-sm text-primary underline-offset-4 hover:underline">
            Voltar
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</CardTitle>
            <CardDescription>Campos obrigatórios: nome</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem</Label>
                  <Input
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    inputMode="numeric"
                    className="h-11"
                  />
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
                <Label htmlFor="availability">Disponibilidade (JSON array ou null)</Label>
                <textarea
                  id="availability"
                  value={availabilityJson}
                  onChange={(e) => setAvailabilityJson(e.target.value)}
                  className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='Ex: [{"days":[1,2,3],"start":"11:00","end":"15:00"}] ou null'
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11" disabled={name.trim() === ''}>
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 bg-transparent"
                    onClick={() => {
                      setEditingId(null);
                      setName('');
                      setDescription('');
                      setSortOrder('0');
                      setStatus('active');
                      setAvailabilityJson('');
                      setError('');
                    }}
                  >
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
            <CardDescription>{isLoading ? 'Carregando...' : `${items.length} categorias`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 && !isLoading ? (
              <div className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</div>
            ) : (
              items.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">#{c.sortOrder}</div>
                      <div className="text-xs text-muted-foreground">{c.status}</div>
                    </div>
                    {c.description && <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="h-9 bg-transparent" onClick={() => setEditingId(c.id)}>
                      Editar
                    </Button>
                    <Button type="button" variant="destructive" className="h-9" onClick={() => void handleDelete(c.id)}>
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

export const MenuOnlineCategoriesPage = withModuleGuard(MenuOnlineCategoriesPageContent, 'menu-online');

