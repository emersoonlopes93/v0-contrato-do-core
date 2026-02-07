export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type MenuOnlineStatus = 'active' | 'inactive';

export type MenuOnlineAvailabilityWindow = {
  days: number[];
  start: string;
  end: string;
};

export type MenuOnlineCategoryDTO = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: MenuOnlineStatus;
  availability: MenuOnlineAvailabilityWindow[] | null;
  visibleDelivery: boolean;
  visibleCounter: boolean;
  visibleTable: boolean;
};

export type MenuOnlineProductImageDTO = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type MenuOnlinePriceVariationDTO = {
  id: string;
  name: string;
  price: number;
  priceDelta: number;
  isDefault: boolean;
  sortOrder: number;
  status: MenuOnlineStatus;
};

export type MenuOnlineProductDTO = {
  id: string;
  categoryId: string;
  sku: string | null;
  name: string;
  description: string | null;
  status: MenuOnlineStatus;
  sortOrder: number;
  basePrice: number;
  promoPrice: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  images: MenuOnlineProductImageDTO[];
  priceVariations: MenuOnlinePriceVariationDTO[];
  modifierGroupIds: string[];
};

export type MenuOnlineModifierGroupDTO = {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  sortOrder: number;
  status: MenuOnlineStatus;
};

export type MenuOnlineModifierOptionDTO = {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
  status: MenuOnlineStatus;
};

export type MenuOnlineSettingsDTO = {
  currency: string;
  showOutOfStock: boolean;
  showImages: boolean;
};

export type MenuOnlinePublicTenantAddressDTO = {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type MenuOnlinePublicMenuDTO = {
  tenant: {
    id: string;
    slug: string;
    tradeName: string | null;
    address: MenuOnlinePublicTenantAddressDTO;
    isOpen: boolean;
  };
  settings: MenuOnlineSettingsDTO;
  categories: MenuOnlineCategoryDTO[];
  products: MenuOnlineProductDTO[];
  modifierGroups: MenuOnlineModifierGroupDTO[];
  modifierOptions: MenuOnlineModifierOptionDTO[];
  combos: MenuOnlineComboDTO[];
  upsellSuggestions?: MenuOnlineUpsellSuggestionDTO[];
  loyaltyConfig?: MenuOnlineLoyaltyConfigDTO;
  cashbackConfig?: MenuOnlineCashbackConfigDTO;
};

export type MenuOnlineCreateCategoryRequest = {
  name: string;
  description?: string | null;
  sortOrder?: number;
  status?: MenuOnlineStatus;
  availability?: MenuOnlineAvailabilityWindow[] | null;
  visibleDelivery?: boolean;
  visibleCounter?: boolean;
  visibleTable?: boolean;
};

export type MenuOnlineUpdateCategoryRequest = {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  status?: MenuOnlineStatus;
  availability?: MenuOnlineAvailabilityWindow[] | null;
  visibleDelivery?: boolean;
  visibleCounter?: boolean;
  visibleTable?: boolean;
};

export type MenuOnlineCreateProductRequest = {
  categoryId: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  status?: MenuOnlineStatus;
  sortOrder?: number;
  basePrice?: number;
  promoPrice?: number | null;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  modifierGroupIds?: string[];
  images?: Array<{
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
  priceVariations?: Array<{
    name: string;
    price: number;
    priceDelta?: number;
    isDefault?: boolean;
    sortOrder?: number;
    status?: MenuOnlineStatus;
  }>;
};

export type MenuOnlineUpdateProductRequest = {
  categoryId?: string;
  sku?: string | null;
  name?: string;
  description?: string | null;
  status?: MenuOnlineStatus;
  sortOrder?: number;
  basePrice?: number;
  promoPrice?: number | null;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  modifierGroupIds?: string[];
  images?: Array<{
    id?: string;
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
  priceVariations?: Array<{
    id?: string;
    name: string;
    price: number;
    priceDelta?: number;
    isDefault?: boolean;
    sortOrder?: number;
    status?: MenuOnlineStatus;
  }>;
};

export type MenuOnlineCouponType = 'percent' | 'fixed';

export type MenuOnlineCouponDTO = {
  id: string;
  code: string;
  type: MenuOnlineCouponType;
  value: number;
  startsAt: string | null;
  endsAt: string | null;
  maxUsesTotal: number | null;
  maxUsesPerCustomer: number | null;
  status: MenuOnlineStatus;
};

export type MenuOnlineCreateCouponRequest = {
  code: string;
  type: MenuOnlineCouponType;
  value: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUsesTotal?: number | null;
  maxUsesPerCustomer?: number | null;
  status?: MenuOnlineStatus;
};

export type MenuOnlineUpdateCouponRequest = {
  code?: string;
  type?: MenuOnlineCouponType;
  value?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUsesTotal?: number | null;
  maxUsesPerCustomer?: number | null;
  status?: MenuOnlineStatus;
};

export type MenuOnlineComboPricingType = 'fixed_price' | 'discount_percent' | 'discount_amount';

export type MenuOnlineComboItemDTO = {
  id: string;
  productId: string;
  minQty: number;
  maxQty: number;
  sortOrder: number;
  status: MenuOnlineStatus;
};

export type MenuOnlineComboDTO = {
  id: string;
  name: string;
  description: string | null;
  pricingType: MenuOnlineComboPricingType;
  fixedPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  status: MenuOnlineStatus;
  items: MenuOnlineComboItemDTO[];
};

export type MenuOnlineCreateComboRequest = {
  name: string;
  description?: string | null;
  pricingType: MenuOnlineComboPricingType;
  fixedPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  status?: MenuOnlineStatus;
  items: Array<{
    productId: string;
    minQty?: number;
    maxQty?: number;
    sortOrder?: number;
    status?: MenuOnlineStatus;
  }>;
};

export type MenuOnlineUpdateComboRequest = {
  name?: string;
  description?: string | null;
  pricingType?: MenuOnlineComboPricingType;
  fixedPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  status?: MenuOnlineStatus;
  items?: Array<{
    id?: string;
    productId: string;
    minQty?: number;
    maxQty?: number;
    sortOrder?: number;
    status?: MenuOnlineStatus;
  }>;
};

export type MenuOnlineUpsellSuggestionDTO = {
  id: string;
  fromProductId: string | null;
  suggestedProductId: string;
  sortOrder: number;
  status: MenuOnlineStatus;
};

export type MenuOnlineCreateUpsellSuggestionRequest = {
  fromProductId?: string | null;
  suggestedProductId: string;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineUpdateUpsellSuggestionRequest = {
  fromProductId?: string | null;
  suggestedProductId?: string;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineLoyaltyConfigDTO = {
  enabled: boolean;
  pointsPerCurrency: number;
  currencyPerPoint: number;
};

export type MenuOnlineUpdateLoyaltyConfigRequest = {
  enabled?: boolean;
  pointsPerCurrency?: number;
  currencyPerPoint?: number;
};

export type MenuOnlineCashbackConfigDTO = {
  enabled: boolean;
  percent: number;
  expiresDays: number | null;
};

export type MenuOnlineUpdateCashbackConfigRequest = {
  enabled?: boolean;
  percent?: number;
  expiresDays?: number | null;
};

export type MenuOnlineCustomerBalanceDTO = {
  customerKey: string;
  loyaltyPoints: number;
  cashbackBalance: number;
};

export type MenuOnlinePriceSimulationRequest = {
  productId: string;
  variationId?: string | null;
  modifierOptionIds?: string[];
  couponCode?: string | null;
  customerKey?: string | null;
};

export type MenuOnlinePriceSimulationResponse = {
  currency: string;
  basePrice: number;
  variationDelta: number;
  modifiersTotal: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCouponCode: string | null;
};

export type MenuOnlineCheckoutItemRequest = {
  productId: string;
  quantity: number;
  variationId?: string | null;
  modifierOptionIds?: string[];
  couponCode?: string | null;
};

export type MenuOnlineCheckoutRequest = {
  items: MenuOnlineCheckoutItemRequest[];
  deliveryType?: 'delivery' | 'pickup' | 'local' | null;
  paymentMethod?: 'cash' | 'pix' | 'card' | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerKey?: string | null;
};

export type MenuOnlineCheckoutResponse = {
  orderId: string;
  publicOrderCode: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};

export type MenuOnlinePublicOrderSummaryDTO = {
  orderId: string;
  publicOrderCode: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  items: Array<{ name: string; quantity: number; total: number }>;
  totals: { subtotal: number; discount: number; total: number; currency: string };
};

export type MenuOnlineCreateModifierGroupRequest = {
  name: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineUpdateModifierGroupRequest = {
  name?: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineCreateModifierOptionRequest = {
  groupId: string;
  name: string;
  priceDelta?: number;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineUpdateModifierOptionRequest = {
  name?: string;
  priceDelta?: number;
  sortOrder?: number;
  status?: MenuOnlineStatus;
};

export type MenuOnlineUpdateSettingsRequest = {
  currency?: string;
  showOutOfStock?: boolean;
  showImages?: boolean;
};
