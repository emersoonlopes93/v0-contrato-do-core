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
  MenuOnlineCreateModifierGroupRequest,
  MenuOnlineCreateModifierOptionRequest,
  MenuOnlineModifierGroupDTO,
  MenuOnlineModifierOptionDTO,
  MenuOnlineStatus,
  MenuOnlineUpdateModifierGroupRequest,
  MenuOnlineUpdateModifierOptionRequest,
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

async function apiRequestJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

async function apiRequestNoContent(url: string, accessToken: string, init: RequestInit): Promise<void> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (response.ok) return;

  const raw: unknown = await response.json().catch(() => null);
  if (isApiErrorResponse(raw)) throw new Error(raw.message);
  throw new Error('Falha na requisição');
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

function parseBoolean(value: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function MenuOnlineModifiersPageContent() {
  const { accessToken } = useSession();
  const [groups, setGroups] = useState<MenuOnlineModifierGroupDTO[]>([]);
  const [options, setOptions] = useState<MenuOnlineModifierOptionDTO[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [groupEditingId, setGroupEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [groupDescription, setGroupDescription] = useState<string>('');
  const [groupMinSelect, setGroupMinSelect] = useState<string>('0');
  const [groupMaxSelect, setGroupMaxSelect] = useState<string>('1');
  const [groupIsRequired, setGroupIsRequired] = useState<string>('false');
  const [groupSortOrder, setGroupSortOrder] = useState<string>('0');
  const [groupStatus, setGroupStatus] = useState<MenuOnlineStatus>('active');

  const [optionEditingId, setOptionEditingId] = useState<string | null>(null);
  const [optionName, setOptionName] = useState<string>('');
  const [optionPriceDelta, setOptionPriceDelta] = useState<string>('0');
  const [optionSortOrder, setOptionSortOrder] = useState<string>('0');
  const [optionStatus, setOptionStatus] = useState<MenuOnlineStatus>('active');

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  async function loadGroups(): Promise<void> {
    if (!accessToken) return;
    const data = await apiRequestJson<MenuOnlineModifierGroupDTO[]>(
      '/api/v1/tenant/menu-online/modifiers/groups',
      accessToken,
    );
    setGroups(data);
  }

  async function loadOptions(groupId: string): Promise<void> {
    if (!accessToken) return;
    const data = await apiRequestJson<MenuOnlineModifierOptionDTO[]>(
      `/api/v1/tenant/menu-online/modifiers/groups/${groupId}/options`,
      accessToken,
    );
    setOptions(data);
  }

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequestJson<MenuOnlineModifierGroupDTO[]>(
          '/api/v1/tenant/menu-online/modifiers/groups',
          accessToken,
        );
        if (cancelled) return;
        setGroups(data);
        if (data.length > 0) {
          const firstId = data[0].id;
          setSelectedGroupId((prev) => prev || firstId);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar complementos');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    if (!selectedGroupId) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const data = await apiRequestJson<MenuOnlineModifierOptionDTO[]>(
          `/api/v1/tenant/menu-online/modifiers/groups/${selectedGroupId}/options`,
          accessToken,
        );
        if (cancelled) return;
        setOptions(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar opções');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedGroupId]);

  function startEditGroup(group: MenuOnlineModifierGroupDTO): void {
    setGroupEditingId(group.id);
    setGroupName(group.name);
    setGroupDescription(group.description ?? '');
    setGroupMinSelect(String(group.minSelect));
    setGroupMaxSelect(String(group.maxSelect));
    setGroupIsRequired(group.isRequired ? 'true' : 'false');
    setGroupSortOrder(String(group.sortOrder));
    setGroupStatus(group.status);
  }

  function resetGroupForm(): void {
    setGroupEditingId(null);
    setGroupName('');
    setGroupDescription('');
    setGroupMinSelect('0');
    setGroupMaxSelect('1');
    setGroupIsRequired('false');
    setGroupSortOrder('0');
    setGroupStatus('active');
  }

  async function submitGroup(): Promise<void> {
    if (!accessToken) return;
    setError('');

    const name = groupName.trim();
    if (!name) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    const minSelect = parseNumber(groupMinSelect);
    const maxSelect = parseNumber(groupMaxSelect);
    const sortOrder = parseNumber(groupSortOrder);
    const isRequired = parseBoolean(groupIsRequired);
    const status = groupStatus;

    if (minSelect === undefined || maxSelect === undefined || sortOrder === undefined || isRequired === undefined) {
      setError('Campos numéricos/booleanos inválidos');
      return;
    }

    if (groupEditingId) {
      const payload: MenuOnlineUpdateModifierGroupRequest = {
        name,
        description: groupDescription.trim() === '' ? null : groupDescription.trim(),
        minSelect,
        maxSelect,
        isRequired,
        sortOrder,
        status,
      };
      await apiRequestJson<MenuOnlineModifierGroupDTO>(
        `/api/v1/tenant/menu-online/modifiers/groups/${groupEditingId}`,
        accessToken,
        { method: 'PUT', body: JSON.stringify(payload) },
      );
    } else {
      const payload: MenuOnlineCreateModifierGroupRequest = {
        name,
        description: groupDescription.trim() === '' ? null : groupDescription.trim(),
        minSelect,
        maxSelect,
        isRequired,
        sortOrder,
        status,
      };
      await apiRequestJson<MenuOnlineModifierGroupDTO>(
        '/api/v1/tenant/menu-online/modifiers/groups',
        accessToken,
        { method: 'POST', body: JSON.stringify(payload) },
      );
    }

    resetGroupForm();
    await loadGroups();
  }

  async function deleteGroup(groupId: string): Promise<void> {
    if (!accessToken) return;
    setError('');
    await apiRequestNoContent(
      `/api/v1/tenant/menu-online/modifiers/groups/${groupId}`,
      accessToken,
      { method: 'DELETE' },
    );
    if (selectedGroupId === groupId) {
      setSelectedGroupId('');
      setOptions([]);
    }
    resetGroupForm();
    await loadGroups();
  }

  function startEditOption(option: MenuOnlineModifierOptionDTO): void {
    setOptionEditingId(option.id);
    setOptionName(option.name);
    setOptionPriceDelta(String(option.priceDelta));
    setOptionSortOrder(String(option.sortOrder));
    setOptionStatus(option.status);
  }

  function resetOptionForm(): void {
    setOptionEditingId(null);
    setOptionName('');
    setOptionPriceDelta('0');
    setOptionSortOrder('0');
    setOptionStatus('active');
  }

  async function submitOption(): Promise<void> {
    if (!accessToken) return;
    setError('');
    if (!selectedGroupId) {
      setError('Selecione um grupo');
      return;
    }

    const name = optionName.trim();
    if (!name) {
      setError('Nome da opção é obrigatório');
      return;
    }

    const priceDelta = parseNumber(optionPriceDelta);
    const sortOrder = parseNumber(optionSortOrder);
    const status = optionStatus;
    if (priceDelta === undefined || sortOrder === undefined) {
      setError('Campos numéricos inválidos');
      return;
    }

    if (optionEditingId) {
      const payload: MenuOnlineUpdateModifierOptionRequest = {
        name,
        priceDelta,
        sortOrder,
        status,
      };
      await apiRequestJson<MenuOnlineModifierOptionDTO>(
        `/api/v1/tenant/menu-online/modifiers/options/${optionEditingId}`,
        accessToken,
        { method: 'PUT', body: JSON.stringify(payload) },
      );
    } else {
      const payload: MenuOnlineCreateModifierOptionRequest = {
        groupId: selectedGroupId,
        name,
        priceDelta,
        sortOrder,
        status,
      };
      await apiRequestJson<MenuOnlineModifierOptionDTO>(
        '/api/v1/tenant/menu-online/modifiers/options',
        accessToken,
        { method: 'POST', body: JSON.stringify(payload) },
      );
    }

    resetOptionForm();
    await loadOptions(selectedGroupId);
  }

  async function deleteOption(optionId: string): Promise<void> {
    if (!accessToken) return;
    setError('');
    await apiRequestNoContent(
      `/api/v1/tenant/menu-online/modifiers/options/${optionId}`,
      accessToken,
      { method: 'DELETE' },
    );
    resetOptionForm();
    if (selectedGroupId) await loadOptions(selectedGroupId);
  }

  if (!accessToken) return null;

  return (
    <PermissionGuard permission="menu.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Complementos</h1>
          <p className="text-muted-foreground">Grupos e opções de adicionais</p>
        </div>

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
                <CardTitle>Grupos</CardTitle>
                <CardDescription>Crie e edite grupos (ex: Bebidas, Molhos)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {groups.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum grupo cadastrado</div>
                  ) : (
                    groups.map((g) => (
                      <div key={g.id} className="flex flex-col gap-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => setSelectedGroupId(g.id)}
                          >
                            <div className="font-medium">{g.name}</div>
                            <div className="text-xs text-muted-foreground">
                              min {g.minSelect} / max {g.maxSelect} · {g.status}
                            </div>
                          </button>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEditGroup(g)}>
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => void deleteGroup(g.id)}>
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <PermissionGuard permission="modifiers.manage">
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="font-medium">{groupEditingId ? 'Editar grupo' : 'Novo grupo'}</div>

                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Mínimo</Label>
                        <Input value={groupMinSelect} onChange={(e) => setGroupMinSelect(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Máximo</Label>
                        <Input value={groupMaxSelect} onChange={(e) => setGroupMaxSelect(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Obrigatório</Label>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={groupIsRequired}
                          onChange={(e) => setGroupIsRequired(e.target.value)}
                        >
                          <option value="false">Não</option>
                          <option value="true">Sim</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          value={groupStatus}
                          onChange={(e) => {
                            const next = parseStatus(e.target.value);
                            if (next) setGroupStatus(next);
                          }}
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ordem</Label>
                      <Input value={groupSortOrder} onChange={(e) => setGroupSortOrder(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => void submitGroup()}>{groupEditingId ? 'Salvar' : 'Criar'}</Button>
                      <Button variant="outline" onClick={resetGroupForm}>
                        Limpar
                      </Button>
                    </div>
                  </div>
                </PermissionGuard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opções</CardTitle>
                <CardDescription>
                  {selectedGroup ? `Grupo: ${selectedGroup.name}` : 'Selecione um grupo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedGroupId ? (
                  <div className="text-sm text-muted-foreground">Selecione um grupo para ver as opções</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {options.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhuma opção cadastrada</div>
                      ) : (
                        options.map((o) => (
                          <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                            <div>
                              <div className="font-medium">{o.name}</div>
                              <div className="text-xs text-muted-foreground">
                                +{o.priceDelta} · ordem {o.sortOrder} · {o.status}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => startEditOption(o)}>
                                Editar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => void deleteOption(o.id)}>
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <PermissionGuard permission="modifiers.manage">
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="font-medium">{optionEditingId ? 'Editar opção' : 'Nova opção'}</div>

                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input value={optionName} onChange={(e) => setOptionName(e.target.value)} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Preço adicional</Label>
                            <Input value={optionPriceDelta} onChange={(e) => setOptionPriceDelta(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ordem</Label>
                            <Input value={optionSortOrder} onChange={(e) => setOptionSortOrder(e.target.value)} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={optionStatus}
                            onChange={(e) => {
                              const next = parseStatus(e.target.value);
                              if (next) setOptionStatus(next);
                            }}
                          >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => void submitOption()}>{optionEditingId ? 'Salvar' : 'Criar'}</Button>
                          <Button variant="outline" onClick={resetOptionForm}>
                            Limpar
                          </Button>
                        </div>
                      </div>
                    </PermissionGuard>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export const MenuOnlineModifiersPage = withModuleGuard(MenuOnlineModifiersPageContent, 'menu-online');
