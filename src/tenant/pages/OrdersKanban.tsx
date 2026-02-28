'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withModuleGuard, PermissionGuard } from '@/src/tenant/components/ModuleGuard';
import { useSession } from '@/src/tenant/context/SessionContext';
import { useTenant } from '@/src/contexts/TenantContext';
import { StatusBadge } from '@/src/tenant/components/cards';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import type { TenantSettingsDTO } from '@/src/types/tenant-settings';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  OrdersOrderDTO,
  OrdersOrderSummaryDTO,
  OrdersUpdateStatusRequest,
} from '@/src/types/orders';
import { REALTIME_ORDER_EVENTS, REALTIME_PAYMENT_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import type { OrdersKanbanUpdatableEvent } from '@/src/types/realtime';
import {
  CheckCircle2,
  ClipboardList,
  Flame,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Printer,
  UserPlus,
  SlidersHorizontal,
  Timer,
  Truck,
  XCircle,
} from 'lucide-react';
import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

async function apiGet<T>(url: string, tenantSlug: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
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

async function apiPatch<TResponse, TBody extends Record<string, unknown>>(
  url: string,
  tenantSlug: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Context': 'tenant_user',
      'X-Tenant-Slug': tenantSlug,
    },
    body: JSON.stringify(body),
  });

  const raw: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorResponse(raw)) throw new Error(raw.message);
    throw new Error('Falha na requisição');
  }

  if (!isApiSuccessResponse<TResponse>(raw)) throw new Error('Resposta inválida');
  return raw.data;
}

type KanbanColumn = {
  key: string;
  title: string;
};

type DropdownCheckedState = boolean | 'indeterminate';

type ColumnVirtualState = {
  scrollTop: number;
  height: number;
};

type ColumnVirtualMap = Record<string, ColumnVirtualState>;

type ColumnStyle = {
  accent: string;
  soft: string;
  text: string;
  icon: React.ElementType;
};

const COLUMNS: KanbanColumn[] = [
  { key: 'created', title: 'Criado' },
  { key: 'accepted', title: 'Aceito' },
  { key: 'preparing', title: 'Preparando' },
  { key: 'ready', title: 'Pronto' },
  { key: 'completed', title: 'Concluído' },
  { key: 'cancelled', title: 'Cancelado' },
];

const VIRTUAL_ROW_HEIGHT = 176;
const VIRTUAL_OVERSCAN = 6;
const DEFAULT_COLUMN_STYLE: ColumnStyle = {
  accent: 'bg-slate-300/60',
  soft: 'bg-slate-50/90',
  text: 'text-slate-700',
  icon: ClipboardList,
};
const COLUMN_STYLES: Record<string, ColumnStyle> = {
  created: DEFAULT_COLUMN_STYLE,
  accepted: {
    accent: 'bg-slate-200/70',
    soft: 'bg-slate-50/80',
    text: 'text-slate-700',
    icon: ClipboardList,
  },
  preparing: {
    accent: 'bg-orange-200/70',
    soft: 'bg-orange-50/80',
    text: 'text-orange-700',
    icon: Flame,
  },
  ready: {
    accent: 'bg-sky-200/70',
    soft: 'bg-sky-50/80',
    text: 'text-sky-700',
    icon: Truck,
  },
  completed: {
    accent: 'bg-emerald-200/70',
    soft: 'bg-emerald-50/80',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
  cancelled: {
    accent: 'bg-rose-200/70',
    soft: 'bg-rose-50/80',
    text: 'text-rose-700',
    icon: XCircle,
  },
};

function OrdersKanbanPageContent() {
  const { tenantSlug } = useTenant();
  const { tenantSettings: tenantSettingsSession } = useSession();
  const [orders, setOrders] = useState<OrdersOrderSummaryDTO[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const key = tenantSlug ? `orders-kanban:${tenantSlug}:visible-columns` : 'orders-kanban::visible-columns';
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isRecord(parsed)) {
          const initial: Record<string, boolean> = {};
          for (const column of COLUMNS) {
            const value = parsed[column.key];
            initial[column.key] = value !== false;
          }
          return initial;
        }
      }
    } catch {
      void 0;
    }
    const initial: Record<string, boolean> = {};
    for (const column of COLUMNS) {
      initial[column.key] = column.key === 'created' || column.key === 'preparing' || column.key === 'ready';
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      void 0;
    }
    return initial;
  });
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [draggingOverColumn, setDraggingOverColumn] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [activeColumnKey, setActiveColumnKey] = useState<string>(COLUMNS[0]?.key ?? 'created');
  const [now, setNow] = useState<number>(() => Date.now());
  const [columnVirtual, setColumnVirtual] = useState<ColumnVirtualMap>(() => {
    const initial: ColumnVirtualMap = {};
    for (const column of COLUMNS) {
      initial[column.key] = { scrollTop: 0, height: 560 };
    }
    return initial;
  });
  const [drivers, setDrivers] = useState<DeliveryDriverDTO[]>([]);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<OrdersOrderDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiGet<OrdersOrderSummaryDTO[]>('/api/v1/tenant/orders', tenantSlug);
        if (cancelled) return;
        setOrders(data);

        try {
          const settings = await apiGet<TenantSettingsDTO | null>('/api/v1/tenant/settings', tenantSlug);
          if (!cancelled) setTenantSettings(settings);
        } catch {
          if (!cancelled) setTenantSettings(null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const handleRealtimeUpdate = useCallback(
    (event: OrdersKanbanUpdatableEvent, payload: { orderId: string; status?: string }) => {
      if (event === REALTIME_ORDER_EVENTS.ORDER_CREATED) {
        // Para order.created, buscamos os detalhes do pedido
        apiGet<OrdersOrderSummaryDTO>(`/api/v1/tenant/orders/${payload.orderId}`, tenantSlug)
          .then((newOrder) => {
            setOrders((prev) => {
              const existingIndex = prev.findIndex((o) => o.id === payload.orderId);
              if (existingIndex !== -1) return prev;
              return [...prev, newOrder];
            });
          })
          .catch(() => {
            // Silenciosamente ignora erros de busca
          });
        return;
      }
      
      setOrders((prev) => {
        const existingIndex = prev.findIndex((o) => o.id === payload.orderId);
        if (
          event === REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED ||
          event === REALTIME_ORDER_EVENTS.ORDER_UPDATED ||
          event === REALTIME_ORDER_EVENTS.ORDER_CANCELLED
        ) {
          if (existingIndex === -1) return prev;
          const next = [...prev];
          const current = next[existingIndex];
          if (!current) return prev;
          const nextStatus = payload.status ?? current.status;
          next[existingIndex] = { ...current, status: nextStatus };
          return next;
        }
        if (
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_CONFIRMED ||
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_FAILED ||
          event === REALTIME_PAYMENT_EVENTS.PAYMENT_EXPIRED
        ) {
          return prev;
        }
        return prev;
      });
    },
    [tenantSlug],
  );

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_CREATED, {
      orderId: envelope.payload.orderId,
    });
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    const status = envelope.payload.status;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, {
      orderId: envelope.payload.orderId,
      status,
    });
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_UPDATED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    const status = envelope.payload.status;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_UPDATED, {
      orderId: envelope.payload.orderId,
      status,
    });
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CANCELLED, (envelope) => {
    if (!tenantSlug) return;
    if (envelope.tenantId !== tenantSlug && envelope.tenantId !== '') return;
    const status = envelope.payload.status;
    handleRealtimeUpdate(REALTIME_ORDER_EVENTS.ORDER_CANCELLED, {
      orderId: envelope.payload.orderId,
      status,
    });
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<DeliveryDriverDTO[]>('/api/v1/tenant/delivery-drivers', tenantSlug);
        if (!cancelled) setDrivers(data);
      } catch {
        if (!cancelled) setDrivers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const getAssignedDriverName = useCallback(
    (orderId: string) => {
      const driver = drivers.find((d) => d.activeOrderId === orderId);
      return driver?.name ?? null;
    },
    [drivers],
  );

  const handleColumnVisibilityChange = useCallback(
    (columnKey: string, checked: DropdownCheckedState) => {
      setVisibleColumns((prev) => {
        const next = { ...prev, [columnKey]: checked === true };
        const key = tenantSlug ? `orders-kanban:${tenantSlug}:visible-columns` : 'orders-kanban::visible-columns';
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          void 0;
        }
        return next;
      });
    },
    [tenantSlug],
  );

  const handleColumnScroll = useCallback(
    (columnKey: string, event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      setColumnVirtual((prev) => ({
        ...prev,
        [columnKey]: {
          scrollTop: target.scrollTop,
          height: target.clientHeight,
        },
      }));
    },
    [],
  );

  const parseDragPayload = useCallback((value: string) => {
    if (!value) return null;
    try {
      const parsed: unknown = JSON.parse(value);
      if (!isRecord(parsed)) return null;
      if (typeof parsed.orderId !== 'string' || typeof parsed.status !== 'string') return null;
      return { orderId: parsed.orderId, status: parsed.status };
    } catch {
      return null;
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      if (!tenantSlug) return;
      const current = orders.find((order) => order.id === orderId);
      const previousStatus = current?.status ?? null;
      setOrders((prev) => {
        const existingIndex = prev.findIndex((o) => o.id === orderId);
        if (existingIndex === -1) return prev;
        const next = [...prev];
        const existing = next[existingIndex];
        if (!existing) return prev;
        next[existingIndex] = { ...existing, status };
        return next;
      });
      try {
        await apiPatch<OrdersOrderDTO, OrdersUpdateStatusRequest>(
          `/api/v1/tenant/orders/${orderId}/status`,
          tenantSlug,
          { status },
        );
      } catch (e) {
        if (!previousStatus) return;
        setOrders((prev) => {
          const existingIndex = prev.findIndex((o) => o.id === orderId);
          if (existingIndex === -1) return prev;
          const next = [...prev];
          const existing = next[existingIndex];
          if (!existing) return prev;
          next[existingIndex] = { ...existing, status: previousStatus };
          return next;
        });
        setError(e instanceof Error ? e.message : 'Erro ao atualizar status');
      }
    },
    [orders, tenantSlug],
  );

  const handleDragStart = useCallback(
    (order: OrdersOrderSummaryDTO, event: React.DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        'application/json',
        JSON.stringify({ orderId: order.id, status: order.status }),
      );
      setDraggingOrderId(order.id);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingOrderId(null);
    setDraggingOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (columnKey: string, event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const raw =
        event.dataTransfer.getData('application/json') ||
        event.dataTransfer.getData('text/plain');
      const payload = parseDragPayload(raw);
      if (!payload) return;
      if (payload.status === columnKey) return;
      void updateOrderStatus(payload.orderId, columnKey);
      setDraggingOverColumn(null);
    },
    [parseDragPayload, updateOrderStatus],
  );

  const visibleColumnList = useMemo(() => {
    const base = COLUMNS.filter((column) => visibleColumns[column.key] !== false);
    return base;
  }, [visibleColumns]);

  useEffect(() => {
    const first = visibleColumnList[0]?.key;
    if (!first) return;
    if (!visibleColumnList.some((column) => column.key === activeColumnKey)) {
      setActiveColumnKey(first);
    }
  }, [activeColumnKey, visibleColumnList]);

  const byStatus = useMemo(() => {
    const map = new Map<string, OrdersOrderSummaryDTO[]>();
    for (const c of COLUMNS) map.set(c.key, []);
    for (const o of orders) {
      const key = map.has(o.status) ? o.status : 'created';
      const current = map.get(key);
      if (current) current.push(o);
    }
    for (const c of COLUMNS) {
      const list = map.get(c.key) ?? [];
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      map.set(c.key, list);
    }
    return map;
  }, [orders]);

  const totalsByStatus = useMemo(() => {
    const totals = new Map<string, number>();
    for (const column of COLUMNS) {
      totals.set(column.key, 0);
    }
    for (const order of orders) {
      const current = totals.get(order.status) ?? 0;
      totals.set(order.status, current + order.total);
    }
    return totals;
  }, [orders]);

  const basePath = `/tenant/${tenantSlug}`;
  const effectiveTimezone = tenantSettings?.timezone ?? tenantSettingsSession?.timezone ?? null;
  const currency = tenantSettings?.currency ?? 'BRL';
  const isOpen = tenantSettings?.isOpen ?? tenantSettingsSession?.isOpen ?? false;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const showSettingsWarning =
    tenantSettings === null ||
    tenantSettings.addressCity === null ||
    tenantSettings.addressState === null ||
    tenantSettings.latitude === null ||
    tenantSettings.longitude === null ||
    effectiveTimezone === null;

  const formatCurrency = useCallback(
    (value: number) => {
      try {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2,
        }).format(value);
      } catch {
        return `${value.toFixed(2)}`;
      }
    },
    [currency],
  );

  const formatElapsed = useCallback(
    (createdAt: string) => {
      const created = new Date(createdAt).getTime();
      const diffMinutes = Math.max(0, Math.floor((now - created) / 60000));
      if (diffMinutes <= 1) return 'Agora';
      return `há ${diffMinutes} min`;
    },
    [now],
  );

  const getStatusLabel = useCallback((status: string) => {
    const column = COLUMNS.find((item) => item.key === status);
    return column?.title ?? status;
  }, []);

  const openDetails = useCallback(
    async (orderId: string) => {
      setDetailsOpen(true);
      setDetailsOrderId(orderId);
      setDetailsLoading(true);
      setDetailsError('');
      try {
        const full = await apiGet<OrdersOrderDTO>(`/api/v1/tenant/orders/${orderId}`, tenantSlug);
        setDetailsOrder(full);
      } catch (e) {
        setDetailsError(e instanceof Error ? e.message : 'Erro ao carregar pedido');
        setDetailsOrder(null);
      } finally {
        setDetailsLoading(false);
      }
    },
    [tenantSlug],
  );

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setDetailsOrderId(null);
    setDetailsOrder(null);
    setDetailsError('');
  }, []);

  const resolveNextStatus = useCallback((current: string): string => {
    const flow = ['created', 'accepted', 'preparing', 'ready', 'completed'];
    const i = flow.indexOf(current);
    if (i === -1) return current;
    const nextIndex = Math.min(flow.length - 1, i + 1);
    const next = flow[nextIndex];
    return typeof next === 'string' ? next : current;
  }, []);

  const resolvePrevStatus = useCallback((current: string): string => {
    const flow = ['created', 'accepted', 'preparing', 'ready', 'completed'];
    const i = flow.indexOf(current);
    if (i <= 0) return current;
    const prevIndex = Math.max(0, i - 1);
    const prev = flow[prevIndex];
    return typeof prev === 'string' ? prev : current;
  }, []);

  const markPaid = useCallback(
    (orderId: string) => {
      const path = `/tenant/${tenantSlug}/payment/${orderId}`;
      window.location.href = path;
    },
    [tenantSlug],
  );

  const triggerPrint = useCallback(() => {
    window.setTimeout(() => window.print(), 50);
  }, []);

  const assignToDriver = useCallback(
    async (driverId: string, orderId: string) => {
      try {
        const updated = await apiPatch<DeliveryDriverDTO, Partial<{ activeOrderId: string | null; status: string }>>(
          `/api/v1/tenant/delivery-drivers/${encodeURIComponent(driverId)}`,
          tenantSlug,
          { activeOrderId: orderId, status: 'delivering' },
        );
        setDrivers((prev) => {
          const index = prev.findIndex((d) => d.id === updated.id);
          const next = [...prev];
          if (index >= 0) next[index] = updated;
          else next.push(updated);
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao atribuir entregador');
      }
    },
    [tenantSlug],
  );
  return (
    <PermissionGuard permission="orders.read">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Pedidos</h1>
                {!focusMode && (
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isOpen
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isOpen ? 'Loja aberta' : 'Loja fechada'}
                  </Badge>
                )}
              </div>
              {!focusMode && <p className="text-sm text-muted-foreground sm:text-base">Operação em tempo real</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!focusMode && (
                <>
                  <Button variant="outline" onClick={() => (window.location.href = `${basePath}/orders`)}>
                    Lista
                  </Button>
                  <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>{totalOrders} pedidos</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                    <span>{formatCurrency(totalRevenue)}</span>
                  </div>
                </>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 rounded-full px-3">
                          <SlidersHorizontal className="h-4 w-4" />
                          Colunas
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {COLUMNS.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns[column.key] !== false}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange(column.key, checked)
                            }
                          >
                            {column.title}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent>Personalizar colunas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 bg-background/80 pb-2 backdrop-blur md:static md:bg-transparent md:pb-0">
            <div className="flex items-center gap-2 rounded-full border px-3 py-1 bg-muted/30">
              <Switch checked={focusMode} onCheckedChange={setFocusMode} />
              <span className="text-sm font-medium text-muted-foreground">Modo foco</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {visibleColumnList.map((column) => {
                const isActive = column.key === activeColumnKey;
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => setActiveColumnKey(column.key)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {column.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {showSettingsWarning && (
          <Alert>
            <AlertDescription>
              Configurações da loja incompletas (endereço/lat/long/timezone). Preencha em{' '}
              <a href={`${basePath}/settings`} className="underline underline-offset-4">
                Configurações
              </a>
              .
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-hidden pb-6">
            {visibleColumnList.map((c) => {
              const list = byStatus.get(c.key) ?? [];
              const virtualState = columnVirtual[c.key] ?? { scrollTop: 0, height: 560 };
              const startIndex = Math.max(
                0,
                Math.floor(virtualState.scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
              );
              const endIndex = Math.min(
                list.length - 1,
                Math.floor((virtualState.scrollTop + virtualState.height) / VIRTUAL_ROW_HEIGHT) +
                  VIRTUAL_OVERSCAN,
              );
              const visibleItems = list.slice(startIndex, endIndex + 1);
              const totalHeight = list.length * VIRTUAL_ROW_HEIGHT;
              const columnStyle = COLUMN_STYLES[c.key] ?? DEFAULT_COLUMN_STYLE;
              const ColumnIcon = columnStyle.icon;
              const columnTotal = totalsByStatus.get(c.key) ?? 0;
              const isActiveColumn = c.key === activeColumnKey;
              return (
                <div
                  key={c.key}
                  className={`flex w-full min-w-0 flex-col gap-4 md:flex ${
                    isActiveColumn ? 'flex' : 'hidden md:flex'
                  }`}
                >
                  <div className={`overflow-hidden rounded-2xl border ${columnStyle.soft}`}>
                    <div className={`h-1 w-full ${columnStyle.accent}`} />
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${columnStyle.accent}`}>
                          <ColumnIcon className={`h-4 w-4 ${columnStyle.text}`} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{c.title}</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(columnTotal)}</div>
                        </div>
                      </div>
                       <div className="flex items-center gap-2">
                         <StatusBadge status={c.key} label="" className="h-2 w-2 p-0" />
                         <div className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
                           {list.length}
                         </div>
                       </div>
                    </div>
                  </div>
                  <div
                    className={`relative min-h-[140px] rounded-2xl border border-border/40 bg-background/80 p-3 transition ${
                      draggingOverColumn === c.key ? 'ring-2 ring-primary/30' : ''
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggingOverColumn !== c.key) {
                        setDraggingOverColumn(c.key);
                      }
                    }}
                    onDrop={(event) => handleDrop(c.key, event)}
                  >
                    <div
                      className="max-h-[70vh] overflow-auto pr-1"
                      onScroll={(event) => handleColumnScroll(c.key, event)}
                      onMouseEnter={(event) => handleColumnScroll(c.key, event)}
                      onMouseLeave={() => setDraggingOverColumn(null)}
                    >
                      <div className="relative" style={{ height: totalHeight }}>
                        {visibleItems.map((o, index) => {
                          const itemIndex = startIndex + index;
                          const elapsed = formatElapsed(o.createdAt);
                          const urgent =
                            new Date(o.createdAt).getTime() > 0 &&
                            now - new Date(o.createdAt).getTime() >= 30 * 60000;
                          return (
                            <div
                              key={o.id}
                              className="absolute left-0 right-0"
                              style={{ top: itemIndex * VIRTUAL_ROW_HEIGHT }}
                              draggable
                              onDragStart={(event) => handleDragStart(o, event)}
                              onDragEnd={handleDragEnd}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => void openDetails(o.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    void openDetails(o.id);
                                  }
                                }}
                                className={`group w-full rounded-xl border border-border/40 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                  urgent
                                    ? 'border-amber-200 ring-1 ring-amber-200/60'
                                    : 'border-border/60'
                                } ${draggingOrderId === o.id ? 'opacity-60 shadow-none' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="text-xl font-bold text-foreground">
                                      #{o.orderNumber}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="gap-1 rounded-full border-border/60 bg-muted/40 px-2 text-xs font-semibold text-muted-foreground"
                                      >
                                        <Timer className="h-3 w-3" />
                                        {elapsed}
                                      </Badge>
                                      {o.source && (
                                        <Badge
                                          variant="secondary"
                                          className="rounded-full px-2 text-xs font-semibold capitalize"
                                        >
                                          {o.source.replace('-', ' ')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-border/60 px-2 text-xs font-semibold text-muted-foreground"
                                    >
                                      {getStatusLabel(o.status)}
                                    </Badge>
                                    <div className="text-lg font-semibold text-foreground">
                                      {formatCurrency(o.total)}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                                  <div className="flex items-center justify-between text-sm leading-6 text-muted-foreground">
                                    <span>Itens</span>
                                    <span className="font-semibold text-foreground">{o.itemsCount}</span>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={o.status} label="" className="h-2 w-2 p-0" />
                                    {getAssignedDriverName(o.id) && (
                                      <Badge variant="secondary" className="rounded-full px-2.5 text-xs font-semibold">
                                        {getAssignedDriverName(o.id)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        const next = resolveNextStatus(o.status);
                                        if (next !== o.status) void updateOrderStatus(o.id, next);
                                      }}
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                      aria-label="Avançar status"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        const prev = resolvePrevStatus(o.status);
                                        if (prev !== o.status) void updateOrderStatus(o.id, prev);
                                      }}
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                      aria-label="Voltar status"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        markPaid(o.id);
                                      }}
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                      aria-label="Marcar como pago"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        triggerPrint();
                                      }}
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                      aria-label="Imprimir pedido"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                          }}
                                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                          aria-label="Atribuir entregador"
                                        >
                                          <UserPlus className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Atribuir entregador</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {drivers.length === 0 ? (
                                          <div className="px-2 py-1 text-xs text-muted-foreground">Nenhum entregador</div>
                                        ) : (
                                          drivers.map((d) => (
                                            <button
                                              key={d.id}
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                void assignToDriver(d.id, o.id);
                                              }}
                                              className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-accent"
                                            >
                                              <span>{d.name}</span>
                                              {d.activeOrderId === o.id && <span className="text-xs text-muted-foreground">Atual</span>}
                                            </button>
                                          ))
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <BaseModal open={detailsOpen} onOpenChange={(open) => (!open ? closeDetails() : null)} size="lg">
          <ModalHeader title={detailsOrder ? `Pedido #${detailsOrder.orderNumber}` : 'Pedido'} />
          <ModalBody>
            {detailsLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
            {detailsError && (
              <Alert variant="destructive">
                <AlertDescription>{detailsError}</AlertDescription>
              </Alert>
            )}
            {!detailsLoading && !detailsError && detailsOrder && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-sm font-semibold">Cliente</div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                      <div>Nome: {detailsOrder.customerName ?? '-'}</div>
                      <div>Telefone: {detailsOrder.customerPhone ?? '-'}</div>
                      <div>Tipo: {detailsOrder.deliveryType ?? '-'}</div>
                      <div>Pagamento: {detailsOrder.paymentMethod ?? '-'}</div>
                      <div>Entregador: {getAssignedDriverName(detailsOrder.id) ?? '-'}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-sm font-semibold">Itens</div>
                    <div className="mt-2 space-y-2">
                      {detailsOrder.items.map((i) => (
                        <div key={i.id} className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {i.quantity}× {i.name}
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(i.totalPrice)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-sm font-semibold">Observações</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {detailsOrder.items
                        .map((i) => i.notes)
                        .filter((n): n is string => typeof n === 'string' && n.length > 0)
                        .join(' • ') || '-'}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-sm font-semibold">Resumo</div>
                    <div className="mt-2 grid gap-1 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Total</span>
                        <span className="font-semibold text-foreground">{formatCurrency(detailsOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {detailsOrderId && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const ord = detailsOrder;
                    if (!ord) return;
                    const next = resolveNextStatus(ord.status);
                    if (next !== ord.status) void updateOrderStatus(ord.id, next);
                  }}
                >
                  Avançar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const ord = detailsOrder;
                    if (!ord) return;
                    const prev = resolvePrevStatus(ord.status);
                    if (prev !== ord.status) void updateOrderStatus(ord.id, prev);
                  }}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const id = detailsOrderId;
                    if (!id) return;
                    markPaid(id);
                  }}
                >
                  Pagamento
                </Button>
                <Button type="button" variant="outline" onClick={() => triggerPrint()}>
                  Imprimir
                </Button>
              </>
            )}
            <Button type="button" onClick={closeDetails}>
              Fechar
            </Button>
          </ModalFooter>
        </BaseModal>
      </div>
    </PermissionGuard>
  );
}

export const OrdersKanbanPage = withModuleGuard(OrdersKanbanPageContent, 'orders-module');
