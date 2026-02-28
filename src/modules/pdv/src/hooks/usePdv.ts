import React from 'react';
import {
  fetchPdvCategories,
  fetchPdvOrders,
  fetchPdvProducts,
  fetchPdvSettings,
  submitPdvOrder,
} from '@/src/modules/pdv/src/services/pdvService';
import { REALTIME_ORDER_EVENTS } from '@/src/core/realtime/contracts';
import { useRealtimeEvent } from '@/src/realtime/useRealtime';
import { ORDERS_OPERATIONAL_STATUS } from '@/src/types/orders';
import type { OrdersCreateOrderRequest, OrdersOrderDTO } from '@/src/types/orders';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';
import type { MenuOnlineCategoryDTO, MenuOnlineProductDTO, MenuOnlineSettingsDTO } from '@/src/types/menu-online';
import type { PdvCartItem, PdvSummary } from '@/src/types/pdv';

type PdvState = {
  products: MenuOnlineProductDTO[];
  categories: MenuOnlineCategoryDTO[];
  settings: MenuOnlineSettingsDTO | null;
  cart: PdvCartItem[];
  summary: PdvSummary;
  recentOrders: OrdersOrderSummaryDTO[];
  ordersLoading: boolean;
  ordersError: string | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  submitError: string | null;
  customerName: string;
  customerPhone: string;
  deliveryType: string;
  addItem: (product: MenuOnlineProductDTO) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerName: (value: string) => void;
  setCustomerPhone: (value: string) => void;
  setDeliveryType: (value: string) => void;
  submitOrder: () => Promise<OrdersOrderDTO | null>;
  refreshMenu: () => Promise<void>;
  refreshOrders: () => Promise<void>;
};

type PdvOptions = {
  enabled?: boolean;
  realtimeEnabled?: boolean;
};

export function usePdv(tenantSlug: string, options?: PdvOptions): PdvState {
  const enabled = options?.enabled ?? true;
  const realtimeEnabled = options?.realtimeEnabled ?? true;
  const [products, setProducts] = React.useState<MenuOnlineProductDTO[]>([]);
  const [categories, setCategories] = React.useState<MenuOnlineCategoryDTO[]>([]);
  const [settings, setSettings] = React.useState<MenuOnlineSettingsDTO | null>(null);
  const [cart, setCart] = React.useState<PdvCartItem[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<OrdersOrderSummaryDTO[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [deliveryType, setDeliveryType] = React.useState('');
  const isMountedRef = React.useRef(true);
  const realtimeReloadRef = React.useRef<number | null>(null);

  const summary = React.useMemo<PdvSummary>(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0);
    return { subtotal, total: subtotal };
  }, [cart]);

  const loadMenu = React.useCallback(async () => {
    if (!enabled) return;
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tempo excedido ao carregar cardápio')), 8000),
      );
      const [productsData, categoriesData, settingsData] = await Promise.race([
        Promise.all([
          fetchPdvProducts(tenantSlug),
          fetchPdvCategories(tenantSlug),
          fetchPdvSettings(tenantSlug).catch(() => null),
        ]),
        timeout,
      ]);
      if (!isMountedRef.current) return;
      setProducts(productsData);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (e: unknown) {
      if (!isMountedRef.current) return;
      const message = e instanceof Error ? e.message : 'Erro ao carregar cardápio';
      setError(message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [enabled, tenantSlug]);

  React.useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (realtimeReloadRef.current) {
        window.clearTimeout(realtimeReloadRef.current);
      }
    };
  }, []);

  const loadOrders = React.useCallback(async (withLoading = true) => {
    if (!enabled) return;
    if (withLoading) {
      setOrdersLoading(true);
      setOrdersError(null);
    }
    try {
      const data = await fetchPdvOrders(tenantSlug);
      setRecentOrders(data.slice(0, 6));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar pedidos';
      setOrdersError(message);
    } finally {
      if (withLoading) setOrdersLoading(false);
    }
  }, [enabled, tenantSlug]);

  React.useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setOrdersLoading(false);
      setError(null);
      setOrdersError(null);
      setProducts([]);
      setCategories([]);
      setSettings(null);
      setRecentOrders([]);
    }
  }, [enabled]);

  const scheduleOrdersReload = React.useCallback(() => {
    if (realtimeReloadRef.current) {
      window.clearTimeout(realtimeReloadRef.current);
    }
    realtimeReloadRef.current = window.setTimeout(() => {
      realtimeReloadRef.current = null;
      void loadOrders(false);
    }, 250);
  }, [loadOrders]);

  const handleRealtime = React.useCallback(() => {
    if (!realtimeEnabled || !enabled) return;
    scheduleOrdersReload();
  }, [enabled, realtimeEnabled, scheduleOrdersReload]);

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_CREATED, () => {
    handleRealtime();
  });

  useRealtimeEvent(REALTIME_ORDER_EVENTS.ORDER_STATUS_CHANGED, () => {
    handleRealtime();
  });

  const addItem = React.useCallback((product: MenuOnlineProductDTO) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing) return [...prev, { product, quantity: 1 }];
      return prev.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    const nextQty = Math.max(1, Math.min(99, quantity));
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: nextQty } : item,
      ),
    );
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
  }, []);

  const submitOrder = React.useCallback(async (): Promise<OrdersOrderDTO | null> => {
    if (!enabled) return null;
    if (cart.length === 0) return null;
    setSubmitting(true);
    setSubmitError(null);
    const items = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      basePrice: item.product.basePrice,
      quantity: item.quantity,
      unitPrice: item.product.basePrice,
      totalPrice: item.product.basePrice * item.quantity,
    }));

    const payload: OrdersCreateOrderRequest = {
      source: 'pdv',
      status: ORDERS_OPERATIONAL_STATUS.NEW,
      total: summary.total,
      paymentMethod: null,
      customerName: customerName.trim() === '' ? null : customerName.trim(),
      customerPhone: customerPhone.trim() === '' ? null : customerPhone.trim(),
      deliveryType: deliveryType.trim() === '' ? null : deliveryType.trim(),
      items,
    };

    try {
      const created = await submitPdvOrder(tenantSlug, payload);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryType('');
      void loadOrders(false);
      return created;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao criar pedido';
      setSubmitError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [cart, customerName, customerPhone, deliveryType, enabled, loadOrders, summary.total, tenantSlug]);

  return {
    products,
    categories,
    settings,
    cart,
    summary,
    recentOrders,
    ordersLoading,
    ordersError,
    loading,
    submitting,
    error,
    submitError,
    customerName,
    customerPhone,
    deliveryType,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerName,
    setCustomerPhone,
    setDeliveryType,
    submitOrder,
    refreshMenu: loadMenu,
    refreshOrders: loadOrders,
  };
}
