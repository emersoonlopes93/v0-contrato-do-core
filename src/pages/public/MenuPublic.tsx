'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/src/types/api';
import type { MenuOnlineCategoryDTO, MenuOnlinePriceSimulationResponse, MenuOnlineProductDTO, MenuOnlinePublicMenuDTO } from '@/src/types/menu-online';
import { ProductCard } from '@/src/tenant/components/cards';
import { BaseModal } from '@/components/modal/BaseModal';
import { ModalHeader } from '@/components/modal/ModalHeader';
import { ModalBody } from '@/components/modal/ModalBody';
import { ModalFooter } from '@/components/modal/ModalFooter';
import { getContrastRatioFromHsl, parseHslTriplet } from '@/lib/color';
import { cn } from '@/lib/utils';
import type { DesignerMenuConfigDTO, SafeColorPalette } from '@/src/types/designer-menu';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

type PublicWhiteLabelConfig = {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  theme?: 'light' | 'dark';
};

type DesignerMenuRuntimeConfig = DesignerMenuConfigDTO;

const DEFAULT_LIGHT_BACKGROUND = '0 0% 100%';
const DEFAULT_DARK_BACKGROUND = '222 47% 11%';
const DEFAULT_LIGHT_PRIMARY_FG = '0 0% 100%';
const DEFAULT_DARK_PRIMARY_FG = '222 47% 11%';

function pickSafeBackground(mode: 'light' | 'dark', candidate: string | undefined): string {
  const trimmed = typeof candidate === 'string' ? candidate.trim() : '';
  const parsed = trimmed ? parseHslTriplet(trimmed) : null;

  if (mode === 'dark') {
    if (parsed && parsed.l <= 35) return trimmed;
    return DEFAULT_DARK_BACKGROUND;
  }

  if (parsed && parsed.l >= 75) return trimmed;
  return DEFAULT_LIGHT_BACKGROUND;
}

function pickBestForeground(primary: string): string | null {
  const primaryHsl = parseHslTriplet(primary);
  if (!primaryHsl) return null;

  const lightFg = parseHslTriplet(DEFAULT_LIGHT_PRIMARY_FG);
  const darkFg = parseHslTriplet(DEFAULT_DARK_PRIMARY_FG);
  if (!lightFg || !darkFg) return null;

  const contrastLight = getContrastRatioFromHsl(primaryHsl, lightFg);
  const contrastDark = getContrastRatioFromHsl(primaryHsl, darkFg);

  return contrastLight >= contrastDark ? DEFAULT_LIGHT_PRIMARY_FG : DEFAULT_DARK_PRIMARY_FG;
}

function applyPublicWhiteLabelToDOM(config: PublicWhiteLabelConfig): void {
  const root = document.documentElement;
  const currentTheme = config.theme === 'dark' ? 'dark' : 'light';

  root.classList.remove('light', 'dark');
  root.classList.add(currentTheme);

  root.style.removeProperty('--tenant-primary');
  root.style.removeProperty('--tenant-primary-foreground');
  root.style.removeProperty('--tenant-secondary');
  root.style.removeProperty('--tenant-background');
  root.style.removeProperty('--tenant-ring');

  const backgroundCandidate = pickSafeBackground(currentTheme, config.backgroundColor);
  root.style.setProperty('--tenant-background', backgroundCandidate);

  const primaryHsl = parseHslTriplet(config.primaryColor);
  const bgHsl = parseHslTriplet(backgroundCandidate);
  const inferredPrimaryForeground = pickBestForeground(config.primaryColor);
  const primaryFgHsl = inferredPrimaryForeground ? parseHslTriplet(inferredPrimaryForeground) : null;

  if (
    primaryHsl &&
    bgHsl &&
    primaryFgHsl &&
    primaryHsl.l <= 65 &&
    getContrastRatioFromHsl(primaryHsl, primaryFgHsl) >= 4.5 &&
    getContrastRatioFromHsl(primaryHsl, bgHsl) >= 4.5 &&
    inferredPrimaryForeground
  ) {
    root.style.setProperty('--tenant-primary', config.primaryColor);
    root.style.setProperty('--tenant-primary-foreground', inferredPrimaryForeground);
    root.style.setProperty('--tenant-ring', config.primaryColor);
  }

  if (parseHslTriplet(config.secondaryColor)) {
    root.style.setProperty('--tenant-secondary', config.secondaryColor);
  }
}

function clearPublicWhiteLabelFromDOM(): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add('light');
  root.style.removeProperty('--tenant-primary');
  root.style.removeProperty('--tenant-primary-foreground');
  root.style.removeProperty('--tenant-secondary');
  root.style.removeProperty('--tenant-background');
  root.style.removeProperty('--tenant-ring');
}

function formatMoney(value: number, currency: string): string {
  if (!Number.isFinite(value)) return `${currency} —`;
  return `${currency} ${value.toFixed(2)}`;
}

function loadDesignerConfigForTenant(tenantSlug: string): DesignerMenuRuntimeConfig | null {
  const key = `designer-menu:${tenantSlug}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { config?: DesignerMenuRuntimeConfig };
    if (!parsed || !parsed.config) {
      return null;
    }
    return parsed.config;
  } catch {
    return null;
  }
}

type PaletteTone = 'base' | 'soft' | 'text' | 'foreground';

const getPaletteValue = (palette: SafeColorPalette | undefined, tone: PaletteTone): string => {
  const safePalette: SafeColorPalette = palette ?? 'blue';
  const suffix = tone === 'base' ? '' : `-${tone}`;
  return `hsl(var(--palette-${safePalette}${suffix}))`;
};

function parseHHMMToMinutes(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getClosingTimeLabelFromAvailability(
  categories: MenuOnlineCategoryDTO[],
  isOpen: boolean,
): string | null {
  if (!isOpen) return null;
  const now = new Date();
  const jsDay = now.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const endTimes: number[] = [];
  for (const category of categories) {
    const windows = category.availability ?? [];
    for (const w of windows) {
      if (!w.days.includes(weekday)) continue;
      const start = parseHHMMToMinutes(w.start);
      const end = parseHHMMToMinutes(w.end);
      if (start === null || end === null) continue;
      if (nowMinutes < start || nowMinutes > end) continue;
      endTimes.push(end);
    }
  }

  const earliestEnd = endTimes.length > 0 ? Math.min(...endTimes) : null;
  if (earliestEnd === null) return null;
  const hh = String(Math.floor(earliestEnd / 60)).padStart(2, '0');
  const mm = String(earliestEnd % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isPromoActive(product: MenuOnlineProductDTO): boolean {
  if (product.promoPrice === null) return false;
  const now = Date.now();
  const startsAt = product.promoStartsAt ? Date.parse(product.promoStartsAt) : null;
  const endsAt = product.promoEndsAt ? Date.parse(product.promoEndsAt) : null;
  if (startsAt !== null && Number.isFinite(startsAt) && now < startsAt) return false;
  if (endsAt !== null && Number.isFinite(endsAt) && now > endsAt) return false;
  return true;
}

type CartItemModifier = {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
};

type CartItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  variation: { id: string; name: string; price: number } | null;
  modifiers: CartItemModifier[];
  quantity: number;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  appliedCouponCode: string | null;
};

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function clampInt(value: number, min: number, max: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, n));
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
  const [whiteLabel, setWhiteLabel] = useState<PublicWhiteLabelConfig | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [selectedModifierOptionIds, setSelectedModifierOptionIds] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [priceSimulation, setPriceSimulation] = useState<MenuOnlinePriceSimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [checkoutCustomerName, setCheckoutCustomerName] = useState<string>('');
  const [checkoutCustomerPhone, setCheckoutCustomerPhone] = useState<string>('');
  const [checkoutDeliveryType, setCheckoutDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'pix' | 'card'>('pix');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');

  // Delivery Fields
  const [checkoutAddressZip, setCheckoutAddressZip] = useState<string>('');
  const [checkoutAddressStreet, setCheckoutAddressStreet] = useState<string>('');
  const [checkoutAddressNumber, setCheckoutAddressNumber] = useState<string>('');
  const [checkoutAddressComplement, setCheckoutAddressComplement] = useState<string>('');
  const [checkoutAddressNeighborhood, setCheckoutAddressNeighborhood] = useState<string>('');
  const [checkoutChangeFor, setCheckoutChangeFor] = useState<string>('');
  const [checkoutObservations, setCheckoutObservations] = useState<string>('');
  const sectionRefs = React.useRef(new Map<string, HTMLElement | null>());
  const [postAddUpsellOpen, setPostAddUpsellOpen] = useState<boolean>(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [designerConfig, setDesignerConfig] = useState<DesignerMenuRuntimeConfig | null>(null);

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
      setWhiteLabel(null);

      try {
        const whiteLabelResponse = await fetch(
          `/api/v1/public/white-label/${encodeURIComponent(tenantSlug)}`,
        );
        const whiteLabelRaw: unknown = await whiteLabelResponse.json().catch(() => null);
        if (whiteLabelResponse.ok && isApiSuccessResponse<PublicWhiteLabelConfig | null>(whiteLabelRaw)) {
          if (!cancelled) {
            setWhiteLabel(whiteLabelRaw.data);
          }
        }

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

  useEffect(() => {
    if (!tenantSlug) {
      setDesignerConfig(null);
      return;
    }

    const loadConfig = () => {
      const config = loadDesignerConfigForTenant(tenantSlug);
      setDesignerConfig(config);
    };

    loadConfig();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `designer-menu:${tenantSlug}`) {
        loadConfig();
      }
    };

    // Escutar mudanças no mesmo tab (custom event)
    const handleCustomStorageChange = () => {
      loadConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('designer-menu-updated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('designer-menu-updated', handleCustomStorageChange);
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (!whiteLabel) {
      clearPublicWhiteLabelFromDOM();
      return;
    }

    applyPublicWhiteLabelToDOM(whiteLabel);
    return () => {
      clearPublicWhiteLabelFromDOM();
    };
  }, [whiteLabel]);

  const modifierGroupsById = useMemo(() => {
    const map = new Map<string, NonNullable<MenuOnlinePublicMenuDTO['modifierGroups']>[number]>();
    if (!data) return map;
    for (const group of data.modifierGroups) {
      map.set(group.id, group);
    }
    return map;
  }, [data]);

  const modifierOptionsByGroupId = useMemo(() => {
    const map = new Map<string, Array<NonNullable<MenuOnlinePublicMenuDTO['modifierOptions']>[number]>>();
    if (!data) return map;
    for (const option of data.modifierOptions) {
      const list = map.get(option.groupId) ?? [];
      list.push(option);
      map.set(option.groupId, list);
    }
    for (const [groupId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(groupId, list);
    }
    return map;
  }, [data]);

  const productModifierGroups = useMemo(() => {
    if (!data || !selectedProduct) return [];
    return selectedProduct.modifierGroupIds
      .map((id) => modifierGroupsById.get(id))
      .filter((v): v is NonNullable<typeof v> => !!v && v.status === 'active');
  }, [data, selectedProduct, modifierGroupsById]);

  const selectionIsValid = useMemo(() => {
    if (!selectedProduct) return true;
    const selectedSet = new Set(selectedModifierOptionIds);
    for (const group of productModifierGroups) {
      const options = modifierOptionsByGroupId.get(group.id) ?? [];
      const selectedCount = options.filter((o) => selectedSet.has(o.id)).length;
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      if (selectedCount < minRequired) return false;
      if (selectedCount > group.maxSelect) return false;
    }
    return true;
  }, [selectedProduct, selectedModifierOptionIds, productModifierGroups, modifierOptionsByGroupId]);

  const selectionIssuesByGroupId = useMemo(() => {
    const map = new Map<string, { minRequired: number; max: number; selected: number; ok: boolean }>();
    if (!selectedProduct) return map;
    const selectedSet = new Set(selectedModifierOptionIds);
    for (const group of productModifierGroups) {
      const options = modifierOptionsByGroupId.get(group.id) ?? [];
      const selectedCount = options.filter((o) => selectedSet.has(o.id)).length;
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      const ok = selectedCount >= minRequired && selectedCount <= group.maxSelect;
      map.set(group.id, { minRequired, max: group.maxSelect, selected: selectedCount, ok });
    }
    return map;
  }, [selectedProduct, selectedModifierOptionIds, productModifierGroups, modifierOptionsByGroupId]);

  useEffect(() => {
    if (!selectedProduct) return;
    const defaultVariation =
      selectedProduct.priceVariations.find((v) => v.isDefault && v.status === 'active') ??
      selectedProduct.priceVariations.find((v) => v.status === 'active') ??
      null;
    setSelectedVariationId(defaultVariation ? defaultVariation.id : null);
    setSelectedModifierOptionIds([]);
    setCouponCode('');
    setPriceSimulation(null);
    setSimulationError('');
    setSelectedQuantity(1);
  }, [selectedProduct]);

  useEffect(() => {
    if (!tenantSlug || !selectedProduct || !isProductModalOpen) return;

    let cancelled = false;
    const run = async () => {
      setIsSimulating(true);
      setSimulationError('');
      try {
        const response = await fetch(`/api/v1/menu/${encodeURIComponent(tenantSlug)}/price/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProduct.id,
            variationId: selectedVariationId,
            modifierOptionIds: selectedModifierOptionIds,
            couponCode: couponCode.trim() === '' ? null : couponCode.trim(),
          }),
        });
        const raw: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          if (isApiErrorResponse(raw)) {
            throw new Error(raw.message);
          }
          throw new Error('Falha ao simular preço');
        }
        if (!isApiSuccessResponse<MenuOnlinePriceSimulationResponse>(raw)) {
          throw new Error('Resposta inválida do servidor');
        }
        if (!cancelled) {
          setPriceSimulation(raw.data);
        }
      } catch (e) {
        if (!cancelled) {
          setPriceSimulation(null);
          setSimulationError(e instanceof Error ? e.message : 'Falha ao simular preço');
        }
      } finally {
        if (!cancelled) setIsSimulating(false);
      }
    };

    if (!selectionIsValid) {
      setPriceSimulation(null);
      setSimulationError('Seleção inválida');
      return;
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, selectedProduct, selectedVariationId, selectedModifierOptionIds, couponCode, isProductModalOpen, selectionIsValid]);

  const tenantName = data?.tenant.tradeName ?? 'Restaurante';
  const isOpen = data?.tenant.isOpen ?? false;
  const currency = data?.settings.currency ?? 'BRL';
  const logoUrl = whiteLabel?.logo ?? null;

  const categoriesOrdered = useMemo<MenuOnlineCategoryDTO[]>(() => {
    if (!data) return [];
    const uniqueCategories = new Map();
    return [...data.categories]
      .filter((c) => c.status === 'active' && c.visibleDelivery)
      .filter((c) => {
        // Prevenir categorias duplicadas
        if (uniqueCategories.has(c.id)) return false;
        uniqueCategories.set(c.id, true);
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data]);

  const hasActiveProducts = useMemo<boolean>(() => {
    if (!data) return false;
    return data.products.some((product) => product.status === 'active');
  }, [data]);

  const closingTimeLabel = useMemo(() => {
    if (!data) return null;
    return getClosingTimeLabelFromAvailability(data.categories, isOpen);
  }, [data, isOpen]);

  const filteredProductsByCategory = useMemo(() => {
    const map = new Map<string, MenuOnlineProductDTO[]>();
    if (!data) return map;
    const query = searchQuery.trim().toLowerCase();
    for (const product of data.products) {
      if (product.status !== 'active') continue;
      if (query.length > 0) {
        const hay = `${product.name} ${product.description ?? ''}`.toLowerCase();
        if (!hay.includes(query)) continue;
      }
      const list = map.get(product.categoryId) ?? [];
      list.push(product);
      map.set(product.categoryId, list);
    }
    for (const [categoryId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(categoryId, list);
    }
    return map;
  }, [data, searchQuery]);

  const hasActivePromotions = useMemo(() => {
    if (!data) return false;
    return data.products.some(isPromoActive);
  }, [data]);

  const cashbackPercent = data?.cashbackConfig?.enabled ? data.cashbackConfig.percent : null;

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal * item.quantity, 0);
    const discount = cart.reduce((acc, item) => acc + item.discount * item.quantity, 0);
    const total = cart.reduce((acc, item) => acc + item.total * item.quantity, 0);
    return { subtotal, discount, total };
  }, [cart]);

  useEffect(() => {
    if (activeCategoryId.trim() !== '') return;
    const first = categoriesOrdered[0]?.id;
    if (first) setActiveCategoryId(first);
  }, [activeCategoryId, categoriesOrdered]);

  useEffect(() => {
    const elements = categoriesOrdered
      .map((c) => sectionRefs.current.get(c.id))
      .filter((v): v is HTMLElement => !!v);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const top = visible[0];
        const id = top?.target?.getAttribute('data-category-id') ?? '';
        if (id) setActiveCategoryId(id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: [0.1, 0.2, 0.3, 0.4, 0.5] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [categoriesOrdered]);

  const popularProducts = useMemo(() => {
    if (!data) return [];
    const suggested = (data.upsellSuggestions ?? [])
      .filter((s) => s.status === 'active' && s.fromProductId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const suggestedProducts = suggested
      .map((s) => data.products.find((p) => p.id === s.suggestedProductId))
      .filter((p): p is MenuOnlineProductDTO => !!p && p.status === 'active');
    if (suggestedProducts.length > 0) return suggestedProducts.slice(0, 10);
    return data.products.filter((p) => p.status === 'active').slice(0, 10);
  }, [data]);

  const contextualUpsellProducts = useMemo(() => {
    if (!data || !lastAddedProductId) return [];
    const fromSpecific = (data.upsellSuggestions ?? [])
      .filter((s) => s.status === 'active' && s.fromProductId === lastAddedProductId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const fromGlobal = (data.upsellSuggestions ?? [])
      .filter((s) => s.status === 'active' && s.fromProductId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const ids = [...fromSpecific, ...fromGlobal].map((s) => s.suggestedProductId);
    const seen = new Set<string>();
    const products: MenuOnlineProductDTO[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const p = data.products.find((x) => x.id === id);
      if (p && p.status === 'active') products.push(p);
    }
    return products.slice(0, 8);
  }, [data, lastAddedProductId]);

  const cartItemsCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  function openProduct(product: MenuOnlineProductDTO): void {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function addConfiguredItemToCart(): void {
    if (!selectedProduct || !priceSimulation || !selectionIsValid) return;
    const qty = clampInt(selectedQuantity, 1, 99);
    const selectedVariation =
      selectedVariationId && selectedVariationId.trim() !== ''
        ? selectedProduct.priceVariations.find((v) => v.id === selectedVariationId && v.status === 'active') ?? null
        : null;

    const options = selectedModifierOptionIds
      .map((id) => data?.modifierOptions.find((o) => o.id === id))
      .filter((o): o is NonNullable<typeof o> => !!o && o.status === 'active');

    const modifiers: CartItemModifier[] = options.map((o) => ({
      id: o.id,
      groupId: o.groupId,
      name: o.name,
      priceDelta: o.priceDelta,
    }));

    const imageUrl = data?.settings.showImages ? selectedProduct.images[0]?.url ?? null : null;

    const item: CartItem = {
      id: randomId(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      imageUrl,
      variation: selectedVariation ? { id: selectedVariation.id, name: selectedVariation.name, price: selectedVariation.price } : null,
      modifiers,
      quantity: qty,
      currency,
      subtotal: priceSimulation.subtotal,
      discount: priceSimulation.discount,
      total: priceSimulation.total,
      appliedCouponCode: priceSimulation.appliedCouponCode,
    };

    setCart((prev) => [item, ...prev]);
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    setLastAddedProductId(item.productId);
    setPostAddUpsellOpen(true);
  }

  function updateCartItemQuantity(id: string, nextQty: number): void {
    const qty = clampInt(nextQty, 1, 99);
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  }

  function removeCartItem(id: string): void {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function submitCheckout(): Promise<void> {
    if (!tenantSlug) return;
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    setCheckoutError('');
    try {
      const body = {
        paymentMethod: checkoutPaymentMethod,
        deliveryType: checkoutDeliveryType,
        customerName: checkoutCustomerName.trim() === '' ? null : checkoutCustomerName.trim(),
        customerPhone: checkoutCustomerPhone.trim() === '' ? null : checkoutCustomerPhone.trim(),
        addressZip: checkoutAddressZip.trim() === '' ? null : checkoutAddressZip.trim(),
        addressStreet: checkoutAddressStreet.trim() === '' ? null : checkoutAddressStreet.trim(),
        addressNumber: checkoutAddressNumber.trim() === '' ? null : checkoutAddressNumber.trim(),
        addressComplement: checkoutAddressComplement.trim() === '' ? null : checkoutAddressComplement.trim(),
        addressNeighborhood: checkoutAddressNeighborhood.trim() === '' ? null : checkoutAddressNeighborhood.trim(),
        changeFor: checkoutPaymentMethod === 'cash' ? (checkoutChangeFor.trim() === '' ? null : Number(checkoutChangeFor)) : null,
        observations: checkoutObservations.trim() === '' ? null : checkoutObservations.trim(),
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variationId: item.variation?.id ?? null,
          modifierOptionIds: item.modifiers.map((m) => m.id),
          couponCode: item.appliedCouponCode,
        })),
      };

      const response = await fetch(`/api/v1/menu/${encodeURIComponent(tenantSlug)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const raw: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (isApiErrorResponse(raw)) throw new Error(raw.message);
        throw new Error('Falha ao finalizar pedido');
      }
      if (!isApiSuccessResponse<{ orderId: string; publicOrderCode: string; status: string }>(raw)) {
        throw new Error('Resposta inválida do servidor');
      }

      const code = raw.data.publicOrderCode;
      setCart([]);
      setCheckoutStep(1);
      setPostAddUpsellOpen(false);
      window.location.assign(`/menu/${encodeURIComponent(tenantSlug)}/order/${encodeURIComponent(code)}`);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : 'Falha ao finalizar pedido');
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  const headerTextPalette = designerConfig?.headerTextColor ?? 'gray';
  const headerButtonPalette = designerConfig?.headerButtonColor ?? 'blue';
  const logoPalette = designerConfig?.logoBackgroundColor ?? 'gray';
  const groupTitlePalette = designerConfig?.groupTitleBackgroundColor ?? 'gray';
  const welcomeBackgroundPalette = designerConfig?.welcomeBackgroundColor ?? 'blue';
  const welcomeTextPalette = designerConfig?.welcomeTextColor ?? 'gray';
  const showWelcomeMessage = designerConfig?.showWelcomeMessage ?? true;

  const headerTextColor = getPaletteValue(
    headerTextPalette,
    designerConfig?.headerVariant === 'solid-primary' ? 'foreground' : 'text',
  );
  const headerButtonBg = getPaletteValue(headerButtonPalette, 'base');
  const headerButtonSoft = getPaletteValue(headerButtonPalette, 'soft');
  const headerButtonText = getPaletteValue(headerButtonPalette, 'text');
  const headerButtonFg = getPaletteValue(headerButtonPalette, 'foreground');
  const logoBg = getPaletteValue(logoPalette, 'soft');
  const logoText = getPaletteValue(logoPalette, 'text');
  const groupTitleBg = getPaletteValue(groupTitlePalette, 'soft');
  const groupTitleText = getPaletteValue(groupTitlePalette, 'text');
  const welcomeBackground = getPaletteValue(welcomeBackgroundPalette, 'soft');
  const welcomeText = getPaletteValue(welcomeTextPalette, 'text');

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        <header
          className={cn(
            'border-b bg-gradient-to-b from-background to-background-surface',
            designerConfig?.headerVariant === 'solid-primary' && 'bg-primary',
          )}
        >
          <div className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: logoBg, color: logoText }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={tenantName}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {tenantName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold leading-tight" style={{ color: headerTextColor }}>
                  {tenantName}
                </h1>
                {data?.tenant.address.city && data.tenant.address.state && (
                  <p className="text-xs" style={{ color: headerTextColor }}>
                    {data.tenant.address.city} - {data.tenant.address.state}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isOpen
                    ? 'border-border-soft bg-success-soft text-success'
                    : 'border-border-soft bg-danger-soft text-danger'
                }
              >
                <span
                  className={
                    isOpen
                      ? 'mr-1.5 h-1.5 w-1.5 rounded-full bg-success'
                      : 'mr-1.5 h-1.5 w-1.5 rounded-full bg-danger'
                  }
                />
                {isOpen ? 'Aberto' : 'Fechado'}
                {isOpen && closingTimeLabel ? ` · Fecha às ${closingTimeLabel}` : ''}
              </Badge>

              {hasActivePromotions && (
                <Badge className="bg-danger text-danger-foreground">Promoções ativas</Badge>
              )}

              {cashbackPercent !== null && cashbackPercent > 0 && (
                <Badge className="bg-primary text-primary-foreground">Cashback {cashbackPercent}%</Badge>
              )}
            </div>
          </div>
        </header>

        {data && (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 sticky top-0 z-20 shadow-sm">
            <div className="px-4 py-3 space-y-3">
              {designerConfig?.showSearchBar === false ? null : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar no cardápio"
                    className="h-11 w-full rounded-full border bg-background pl-10 pr-3 text-sm"
                    style={{ borderColor: headerButtonBg }}
                  />
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1">
                {categoriesOrdered.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      const el = sectionRefs.current.get(category.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setActiveCategoryId(category.id);
                      }
                    }}
                    className="whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold"
                    style={
                      activeCategoryId === category.id
                        ? { backgroundColor: headerButtonBg, color: headerButtonFg, borderColor: headerButtonBg }
                        : { backgroundColor: headerButtonSoft, color: headerButtonText, borderColor: headerButtonBg }
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 space-y-4 px-4 py-4 md:space-y-5 md:py-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="text-sm text-muted-foreground">Carregando cardápio...</div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-4 md:space-y-5">
              {showWelcomeMessage && (
                <section>
                  <div
                    className="rounded-2xl px-4 py-3 text-center text-sm font-medium"
                    style={{ backgroundColor: welcomeBackground, color: welcomeText }}
                  >
                    Bem-vindo ao nosso cardápio!
                  </div>
                </section>
              )}
              {popularProducts.length > 0 && (
                <section className="space-y-2.5 md:space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold md:text-base">Sugestões populares</h2>
                    <span className="text-[11px] text-muted-foreground md:text-xs">
                      Pra decidir mais rápido
                    </span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {popularProducts.map((product) => {
                      const defaultVariation =
                        product.priceVariations.find((v) => v.isDefault && v.status === 'active') ??
                        product.priceVariations.find((v) => v.status === 'active') ??
                        null;
                      const mainPrice = defaultVariation ? defaultVariation.price : product.basePrice;
                      const firstImage = data.settings.showImages ? product.images[0]?.url ?? null : null;
                      return (
                        <div key={product.id} className="min-w-[220px] max-w-[220px]">
                          <ProductCard
                            variant="public"
                            name={product.name}
                            description={product.description}
                            price={mainPrice}
                            imageUrl={firstImage}
                            status={product.status}
                            currency={currency}
                            promoPrice={isPromoActive(product) ? product.promoPrice : null}
                            onClick={() => openProduct(product)}
                            showAddButton={designerConfig?.showAddButton ?? true}
                            imageStyle={designerConfig?.imageStyle}
                            compact={designerConfig?.layoutMode === 'compact'}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
                  const products = filteredProductsByCategory.get(category.id) ?? [];
                  return (
                    <section
                      key={category.id}
                      className="space-y-2.5 scroll-mt-28 md:space-y-3"
                      ref={(el) => {
                        sectionRefs.current.set(category.id, el);
                      }}
                      data-category-id={category.id}
                    >
                      <div
                        className="flex items-baseline justify-between gap-2.5 rounded-xl px-3 py-2"
                        style={{ backgroundColor: groupTitleBg, color: groupTitleText }}
                      >
                        <h2 className="text-base font-semibold md:text-lg">{category.name}</h2>
                        <span className="text-[11px] md:text-xs">{products.length} itens</span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                      {products.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Nenhum produto nesta categoria.
                        </div>
                      ) : (
                        <div
                          className={
                            designerConfig?.layoutMode === 'list'
                              ? 'space-y-3'
                              : designerConfig?.layoutMode === 'compact'
                              ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
                              : 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                          }
                        >
                          {products.map((product) => {
                            const defaultVariation =
                              product.priceVariations.find((v) => v.isDefault && v.status === 'active') ??
                              product.priceVariations.find((v) => v.status === 'active') ??
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
                              variant="public"
                              name={product.name}
                              description={product.description}
                              price={mainPrice}
                              imageUrl={firstImage}
                              status={product.status}
                              currency={currency}
                              priceLabel={mainPriceLabel ?? undefined}
                              promoPrice={isPromoActive(product) ? product.promoPrice : null}
                              onClick={() => openProduct(product)}
                              showAddButton={designerConfig?.showAddButton ?? true}
                              imageStyle={designerConfig?.imageStyle}
                              compact={designerConfig?.layoutMode === 'compact'}
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
                  <ModalBody className="space-y-4">
                    {selectedProduct.description && (
                      <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    )}

                    {selectedProduct.priceVariations.some((v) => v.status === 'active') && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Variação</div>
                        <select
                          value={selectedVariationId ?? ''}
                          onChange={(e) => setSelectedVariationId(e.target.value === '' ? null : e.target.value)}
                          className="h-10 w-full rounded-md border bg-background px-3"
                        >
                          <option value="">Preço base</option>
                          {selectedProduct.priceVariations
                            .filter((v) => v.status === 'active')
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} — {currency} {v.price.toFixed(2)}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {productModifierGroups.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Complementos</div>
                        {productModifierGroups.map((group) => {
                          const options = (modifierOptionsByGroupId.get(group.id) ?? []).filter((o) => o.status === 'active');
                          const selectedSet = new Set(selectedModifierOptionIds);
                          const selectedCount = options.filter((o) => selectedSet.has(o.id)).length;
                          const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
                          const canSelectMore = selectedCount < group.maxSelect;
                          const issue = selectionIssuesByGroupId.get(group.id);
                          const showIssue = issue ? !issue.ok : false;

                          return (
                            <div
                              key={group.id}
                              className={
                                showIssue
                                  ? 'space-y-2 rounded border border-danger/40 bg-danger-soft p-3'
                                  : 'space-y-2 rounded border p-3'
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium">{group.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Escolha {minRequired} até {group.maxSelect} {group.isRequired ? '(obrigatório)' : '(opcional)'}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {selectedCount}/{group.maxSelect}
                                </div>
                              </div>

                              <div className="space-y-2">
                                {options.map((option) => {
                                  const checked = selectedSet.has(option.id);
                                  const disableUnchecked = !checked && !canSelectMore;
                                  const inputType = group.maxSelect === 1 ? 'radio' : 'checkbox';
                                  return (
                                    <label key={option.id} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
                                      <span className="flex items-center gap-2">
                                        <input
                                          type={inputType}
                                          name={`group-${group.id}`}
                                          checked={checked}
                                          disabled={disableUnchecked}
                                          onChange={() => {
                                            setSelectedModifierOptionIds((prev) => {
                                              const set = new Set(prev);
                                              if (group.maxSelect === 1) {
                                                for (const opt of options) {
                                                  set.delete(opt.id);
                                                }
                                                if (!checked) set.add(option.id);
                                                return Array.from(set);
                                              }
                                              if (checked) {
                                                set.delete(option.id);
                                              } else {
                                                set.add(option.id);
                                              }
                                              return Array.from(set);
                                            });
                                          }}
                                        />
                                        <span className="text-sm">{option.name}</span>
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        + {currency} {option.priceDelta.toFixed(2)}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Cupom</div>
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3"
                        placeholder="Código do cupom (opcional)"
                      />
                    </div>

                    {simulationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{simulationError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded border p-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {priceSimulation ? formatMoney(priceSimulation.subtotal * selectedQuantity, currency) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Desconto</span>
                        <span>
                          {priceSimulation ? formatMoney(priceSimulation.discount * selectedQuantity, currency) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-medium">
                        <span>Total</span>
                        <span>
                          {priceSimulation ? formatMoney(priceSimulation.total * selectedQuantity, currency) : '—'}
                        </span>
                      </div>
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedQuantity((q) => clampInt(q - 1, 1, 99))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[2.5rem] text-center text-sm font-semibold">{selectedQuantity}</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedQuantity((q) => clampInt(q + 1, 1, 99))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        className="flex-1 gap-2"
                        onClick={addConfiguredItemToCart}
                        disabled={isSimulating || !priceSimulation || !selectionIsValid}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Adicionar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </ModalFooter>
                </BaseModal>
              )}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {cartItemsCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-0 right-0 z-40 mx-auto w-full max-w-3xl px-4"
          >
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <div className="text-sm font-semibold">
                  {cartItemsCount} item(ns)
                </div>
              </div>
              <div className="text-sm font-bold">{formatMoney(cartTotals.total, currency)}</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setCartOpen(false);
                setCheckoutError('');
              }}
            />
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-background flex max-h-[85vh] flex-col"
            >
              <div className="flex items-center justify-between border-b px-4 py-4">
                <div className="min-w-0">
                  <div className="text-base font-semibold">Seu carrinho</div>
                  <div className="text-xs text-muted-foreground">
                    Pedido enviado direto para o restaurante
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutError('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Seu carrinho está vazio.</div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium">
                              {item.name}
                              {item.variation ? <span className="text-muted-foreground"> · {item.variation.name}</span> : null}
                            </div>
                            {item.modifiers.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {item.modifiers.map((m) => m.name).join(', ')}
                              </div>
                            )}
                            {item.appliedCouponCode && (
                              <div className="mt-1 text-xs text-success">
                                Cupom aplicado: {item.appliedCouponCode}
                              </div>
                            )}
                            <div className="mt-2 text-sm font-semibold">{formatMoney(item.total, item.currency)}</div>
                          </div>

                          <Button type="button" variant="outline" size="icon" onClick={() => removeCartItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[2.5rem] text-center text-sm font-semibold">{item.quantity}</div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-sm font-semibold">{formatMoney(item.total * item.quantity, item.currency)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t bg-background px-4 py-4 space-y-3">
                  <div className="rounded-xl border p-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(cartTotals.subtotal, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Economia</span>
                      <span>{formatMoney(cartTotals.discount, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatMoney(cartTotals.total, currency)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Checkout</div>
                      <div className="text-xs text-muted-foreground">
                        Etapa {checkoutStep}/3
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(1)}
                        className={checkoutStep === 1 ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                      >
                        Dados
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(2)}
                        className={checkoutStep === 2 ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                      >
                        Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(3)}
                        className={checkoutStep === 3 ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                      >
                        Pagamento
                      </button>
                    </div>

                    {checkoutError && (
                      <Alert variant="destructive">
                        <AlertDescription>{checkoutError}</AlertDescription>
                      </Alert>
                    )}

                    {checkoutStep === 1 && (
                      <div className="space-y-2">
                        <input
                          value={checkoutCustomerName}
                          onChange={(e) => setCheckoutCustomerName(e.target.value)}
                          className="h-11 w-full rounded-lg border px-3"
                          placeholder="Seu nome"
                          autoComplete="name"
                        />
                        <input
                          value={checkoutCustomerPhone}
                          onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                          className="h-11 w-full rounded-lg border px-3"
                          placeholder="Seu WhatsApp"
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </div>
                    )}

                    {checkoutStep === 2 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Reduza fricção: escolha como prefere receber.
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutDeliveryType('delivery')}
                            className={checkoutDeliveryType === 'delivery' ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                          >
                            Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutDeliveryType('pickup')}
                            className={checkoutDeliveryType === 'pickup' ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                          >
                            Retirada
                          </button>
                        </div>
                        {checkoutDeliveryType === 'delivery' && (
                          <div className="mt-3 space-y-2">
                            <input
                              value={checkoutAddressZip}
                              onChange={(e) => setCheckoutAddressZip(e.target.value)}
                              className="h-11 w-full rounded-lg border px-3"
                              placeholder="CEP"
                              inputMode="numeric"
                            />
                            <input
                              value={checkoutAddressStreet}
                              onChange={(e) => setCheckoutAddressStreet(e.target.value)}
                              className="h-11 w-full rounded-lg border px-3"
                              placeholder="Rua"
                              autoComplete="address-line1"
                            />
                            <div className="flex gap-2">
                              <input
                                value={checkoutAddressNumber}
                                onChange={(e) => setCheckoutAddressNumber(e.target.value)}
                                className="h-11 w-28 rounded-lg border px-3"
                                placeholder="Número"
                                inputMode="numeric"
                              />
                              <input
                                value={checkoutAddressNeighborhood}
                                onChange={(e) => setCheckoutAddressNeighborhood(e.target.value)}
                                className="h-11 flex-1 rounded-lg border px-3"
                                placeholder="Bairro"
                                autoComplete="address-level2"
                              />
                            </div>
                            <input
                              value={checkoutAddressComplement}
                              onChange={(e) => setCheckoutAddressComplement(e.target.value)}
                              className="h-11 w-full rounded-lg border px-3"
                              placeholder="Complemento (opcional)"
                              autoComplete="address-line2"
                            />
                          </div>
                        )}
                        <textarea
                          value={checkoutObservations}
                          onChange={(e) => setCheckoutObservations(e.target.value)}
                          className="min-h-[96px] w-full resize-none rounded-lg border px-3 py-2 text-sm"
                          placeholder="Observações para o restaurante (opcional)"
                        />
                      </div>
                    )}

                    {checkoutStep === 3 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Pagamento seguro</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutPaymentMethod('pix')}
                            className={checkoutPaymentMethod === 'pix' ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                          >
                            Pix
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutPaymentMethod('card')}
                            className={checkoutPaymentMethod === 'card' ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                          >
                            Cartão
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutPaymentMethod('cash')}
                            className={checkoutPaymentMethod === 'cash' ? 'flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground h-11' : 'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold h-11'}
                          >
                            Dinheiro
                          </button>
                        </div>
                        {checkoutPaymentMethod === 'cash' && (
                          <div className="space-y-2">
                            <input
                              value={checkoutChangeFor}
                              onChange={(e) => setCheckoutChangeFor(e.target.value)}
                              className="h-11 w-full rounded-lg border px-3"
                              placeholder="Troco para (opcional)"
                              inputMode="decimal"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="button"
                      className="w-full"
                      onClick={submitCheckout}
                      disabled={checkoutSubmitting || checkoutCustomerPhone.trim() === '' || checkoutCustomerName.trim() === ''}
                    >
                      {checkoutSubmitting ? 'Enviando...' : 'Finalizar pedido'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {postAddUpsellOpen && contextualUpsellProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setPostAddUpsellOpen(false)} />
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-background"
            >
              <div className="flex items-center justify-between border-b px-4 py-4">
                <div className="min-w-0">
                  <div className="text-base font-semibold">Combina com…</div>
                  <div className="text-xs text-muted-foreground">Clientes também pedem</div>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => setPostAddUpsellOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-4 py-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {contextualUpsellProducts.map((product) => {
                    const defaultVariation =
                      product.priceVariations.find((v) => v.isDefault && v.status === 'active') ??
                      product.priceVariations.find((v) => v.status === 'active') ??
                      null;
                    const mainPrice = defaultVariation ? defaultVariation.price : product.basePrice;
                    const firstImage = data?.settings.showImages ? product.images[0]?.url ?? null : null;
                    return (
                      <div key={product.id} className="min-w-[260px] max-w-[260px]">
                        <ProductCard
                          variant="public"
                          name={product.name}
                          description={product.description}
                          price={mainPrice}
                          imageUrl={firstImage}
                          status={product.status}
                          currency={currency}
                          promoPrice={isPromoActive(product) ? product.promoPrice : null}
                          onClick={() => {
                            setPostAddUpsellOpen(false);
                            openProduct(product);
                          }}
                          showAddButton={designerConfig?.showAddButton ?? true}
                          imageStyle={designerConfig?.imageStyle}
                          compact={designerConfig?.layoutMode === 'compact'}
                        />
                      </div>
                    );
                  })}
                </div>
                <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setPostAddUpsellOpen(false)}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MenuPublicPage;
