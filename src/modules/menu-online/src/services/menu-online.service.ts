import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  MenuOnlineCategoryDTO,
  MenuOnlineComboDTO,
  MenuOnlineCouponDTO,
  MenuOnlineCreateUpsellSuggestionRequest,
  MenuOnlineCreateCategoryRequest,
  MenuOnlineCreateComboRequest,
  MenuOnlineCreateCouponRequest,
  MenuOnlineCreateModifierGroupRequest,
  MenuOnlineCreateModifierOptionRequest,
  MenuOnlineCreateProductRequest,
  MenuOnlineCashbackConfigDTO,
  MenuOnlineCustomerBalanceDTO,
  MenuOnlineLoyaltyConfigDTO,
  MenuOnlineModifierGroupDTO,
  MenuOnlineModifierOptionDTO,
  MenuOnlinePriceSimulationRequest,
  MenuOnlinePriceSimulationResponse,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
  MenuOnlineUpdateCashbackConfigRequest,
  MenuOnlineUpdateCategoryRequest,
  MenuOnlineUpdateComboRequest,
  MenuOnlineUpdateCouponRequest,
  MenuOnlineUpdateLoyaltyConfigRequest,
  MenuOnlineUpdateModifierGroupRequest,
  MenuOnlineUpdateModifierOptionRequest,
  MenuOnlineUpdateProductRequest,
  MenuOnlineUpdateSettingsRequest,
  MenuOnlineUpdateUpsellSuggestionRequest,
  MenuOnlineUpsellSuggestionDTO,
} from '@/src/types/menu-online';
import { MenuOnlineRepository } from '../repositories/menu-online.repository';

export class MenuOnlineService {
  private readonly repository: MenuOnlineRepository;

  constructor(context: ModuleContext) {
    this.repository = new MenuOnlineRepository();
    void context;
  }

  async listCategories(tenantId: string): Promise<MenuOnlineCategoryDTO[]> {
    return this.repository.listCategories(tenantId);
  }

  async createCategory(tenantId: string, input: MenuOnlineCreateCategoryRequest): Promise<MenuOnlineCategoryDTO> {
    return this.repository.createCategory(tenantId, input);
  }

  async updateCategory(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateCategoryRequest,
  ): Promise<MenuOnlineCategoryDTO | null> {
    return this.repository.updateCategory(tenantId, id, input);
  }

  async deleteCategory(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteCategory(tenantId, id);
  }

  async listProducts(tenantId: string): Promise<MenuOnlineProductDTO[]> {
    return this.repository.listProducts(tenantId);
  }

  async createProduct(tenantId: string, input: MenuOnlineCreateProductRequest): Promise<MenuOnlineProductDTO> {
    return this.repository.createProduct(tenantId, input);
  }

  async updateProduct(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateProductRequest,
  ): Promise<MenuOnlineProductDTO | null> {
    return this.repository.updateProduct(tenantId, id, input);
  }

  async deleteProduct(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteProduct(tenantId, id);
  }

  async listModifierGroups(tenantId: string): Promise<MenuOnlineModifierGroupDTO[]> {
    return this.repository.listModifierGroups(tenantId);
  }

  async createModifierGroup(
    tenantId: string,
    input: MenuOnlineCreateModifierGroupRequest,
  ): Promise<MenuOnlineModifierGroupDTO> {
    return this.repository.createModifierGroup(tenantId, input);
  }

  async updateModifierGroup(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateModifierGroupRequest,
  ): Promise<MenuOnlineModifierGroupDTO | null> {
    return this.repository.updateModifierGroup(tenantId, id, input);
  }

  async deleteModifierGroup(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteModifierGroup(tenantId, id);
  }

  async listModifierOptions(tenantId: string, groupId: string): Promise<MenuOnlineModifierOptionDTO[]> {
    return this.repository.listModifierOptions(tenantId, groupId);
  }

  async createModifierOption(
    tenantId: string,
    input: MenuOnlineCreateModifierOptionRequest,
  ): Promise<MenuOnlineModifierOptionDTO> {
    return this.repository.createModifierOption(tenantId, input);
  }

  async updateModifierOption(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateModifierOptionRequest,
  ): Promise<MenuOnlineModifierOptionDTO | null> {
    return this.repository.updateModifierOption(tenantId, id, input);
  }

  async deleteModifierOption(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteModifierOption(tenantId, id);
  }

  async getSettings(tenantId: string): Promise<MenuOnlineSettingsDTO> {
    return this.repository.getSettings(tenantId);
  }

  async updateSettings(tenantId: string, input: MenuOnlineUpdateSettingsRequest): Promise<MenuOnlineSettingsDTO> {
    return this.repository.updateSettings(tenantId, input);
  }

  async listCombos(tenantId: string): Promise<MenuOnlineComboDTO[]> {
    return this.repository.listCombos(tenantId);
  }

  async createCombo(tenantId: string, input: MenuOnlineCreateComboRequest): Promise<MenuOnlineComboDTO> {
    return this.repository.createCombo(tenantId, input);
  }

  async updateCombo(tenantId: string, id: string, input: MenuOnlineUpdateComboRequest): Promise<MenuOnlineComboDTO | null> {
    return this.repository.updateCombo(tenantId, id, input);
  }

  async deleteCombo(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteCombo(tenantId, id);
  }

  async listCoupons(tenantId: string): Promise<MenuOnlineCouponDTO[]> {
    return this.repository.listCoupons(tenantId);
  }

  async createCoupon(tenantId: string, input: MenuOnlineCreateCouponRequest): Promise<MenuOnlineCouponDTO> {
    return this.repository.createCoupon(tenantId, input);
  }

  async updateCoupon(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateCouponRequest,
  ): Promise<MenuOnlineCouponDTO | null> {
    return this.repository.updateCoupon(tenantId, id, input);
  }

  async deleteCoupon(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteCoupon(tenantId, id);
  }

  async validateCoupon(tenantId: string, couponCode: string, customerKey?: string | null): Promise<boolean> {
    const coupon = await this.repository.findCouponByCode(tenantId, couponCode);
    if (!coupon) return false;
    if (coupon.status !== 'active') return false;

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return false;
    if (coupon.endsAt && now > coupon.endsAt) return false;

    if (coupon.maxUsesTotal !== null) {
      const uses = await this.repository.countCouponRedemptions(coupon.id);
      if (uses >= coupon.maxUsesTotal) return false;
    }

    if (coupon.maxUsesPerCustomer !== null && customerKey) {
      const uses = await this.repository.countCouponRedemptionsByCustomer(coupon.id, customerKey);
      if (uses >= coupon.maxUsesPerCustomer) return false;
    }

    return true;
  }

  async simulatePrice(tenantId: string, input: MenuOnlinePriceSimulationRequest): Promise<MenuOnlinePriceSimulationResponse | null> {
    const settings = await this.repository.getSettings(tenantId);
    const pricing = await this.repository.getProductPricingInputs(tenantId, input.productId);
    if (!pricing) return null;

    const groupRules = await this.repository.getProductModifierGroupRules(tenantId, input.productId);
    const allowedGroupIds = new Set(groupRules.map((g) => g.groupId));

    const modifierOptionIds = input.modifierOptionIds ?? [];
    const optionDetails = await this.repository.getModifierOptionsByIds(tenantId, modifierOptionIds);
    if (modifierOptionIds.length !== optionDetails.length) {
      throw new Error('INVALID_MODIFIER_SELECTION');
    }

    const selectedCounts = new Map<string, number>();
    for (const option of optionDetails) {
      if (option.status !== 'active') throw new Error('INVALID_MODIFIER_SELECTION');
      if (!allowedGroupIds.has(option.groupId)) throw new Error('INVALID_MODIFIER_SELECTION');
      selectedCounts.set(option.groupId, (selectedCounts.get(option.groupId) ?? 0) + 1);
    }

    for (const group of groupRules) {
      if (group.status !== 'active') continue;
      const selected = selectedCounts.get(group.groupId) ?? 0;
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      if (selected < minRequired) throw new Error('INVALID_MODIFIER_SELECTION');
      if (selected > group.maxSelect) throw new Error('INVALID_MODIFIER_SELECTION');
    }

    const now = new Date();
    const promoActive =
      pricing.promoPrice !== null &&
      (!pricing.promoStartsAt || now >= pricing.promoStartsAt) &&
      (!pricing.promoEndsAt || now <= pricing.promoEndsAt);

    const basePrice = promoActive && pricing.promoPrice !== null ? pricing.promoPrice : pricing.basePrice;

    let variationDelta = 0;
    if (input.variationId) {
      const variation = await this.repository.getVariationPricingInputs(tenantId, input.productId, input.variationId);
      if (variation) {
        variationDelta = variation.priceDelta !== null ? variation.priceDelta : variation.price - basePrice;
      } else {
        throw new Error('INVALID_VARIATION');
      }
    }

    const modifiersTotal = optionDetails.reduce((acc, opt) => acc + opt.priceDelta, 0);

    const subtotal = basePrice + variationDelta + modifiersTotal;

    let appliedCouponCode: string | null = null;
    let discount = 0;
    if (input.couponCode && input.couponCode.trim() !== '') {
      const code = input.couponCode.trim();
      const isValid = await this.validateCoupon(tenantId, code, input.customerKey);
      if (isValid) {
        const coupon = await this.repository.findCouponByCode(tenantId, code);
        if (coupon) {
          appliedCouponCode = code;
          if (coupon.type === 'percent') {
            discount = Math.max(0, Math.min(subtotal, (subtotal * coupon.value) / 100));
          } else {
            discount = Math.max(0, Math.min(subtotal, coupon.value));
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount);
    return {
      currency: settings.currency,
      basePrice,
      variationDelta,
      modifiersTotal,
      subtotal,
      discount,
      total,
      appliedCouponCode,
    };
  }

  async listUpsellSuggestions(tenantId: string): Promise<MenuOnlineUpsellSuggestionDTO[]> {
    return this.repository.listUpsellSuggestions(tenantId);
  }

  async createUpsellSuggestion(
    tenantId: string,
    input: MenuOnlineCreateUpsellSuggestionRequest,
  ): Promise<MenuOnlineUpsellSuggestionDTO> {
    if (input.suggestedProductId.trim().length === 0) {
      throw new Error('INVALID_UPSELL_SUGGESTION');
    }
    return this.repository.createUpsellSuggestion(tenantId, {
      ...input,
      suggestedProductId: input.suggestedProductId.trim(),
      fromProductId: input.fromProductId === undefined ? undefined : input.fromProductId,
    });
  }

  async updateUpsellSuggestion(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateUpsellSuggestionRequest,
  ): Promise<MenuOnlineUpsellSuggestionDTO | null> {
    return this.repository.updateUpsellSuggestion(tenantId, id, input);
  }

  async deleteUpsellSuggestion(tenantId: string, id: string): Promise<boolean> {
    return this.repository.deleteUpsellSuggestion(tenantId, id);
  }

  async getLoyaltyConfig(tenantId: string): Promise<MenuOnlineLoyaltyConfigDTO> {
    return this.repository.getLoyaltyConfig(tenantId);
  }

  async updateLoyaltyConfig(
    tenantId: string,
    input: MenuOnlineUpdateLoyaltyConfigRequest,
  ): Promise<MenuOnlineLoyaltyConfigDTO> {
    const pointsPerCurrency = input.pointsPerCurrency;
    const currencyPerPoint = input.currencyPerPoint;
    if (pointsPerCurrency !== undefined && pointsPerCurrency < 0) {
      throw new Error('INVALID_LOYALTY_CONFIG');
    }
    if (currencyPerPoint !== undefined && currencyPerPoint < 0) {
      throw new Error('INVALID_LOYALTY_CONFIG');
    }
    return this.repository.updateLoyaltyConfig(tenantId, input);
  }

  async getCashbackConfig(tenantId: string): Promise<MenuOnlineCashbackConfigDTO> {
    return this.repository.getCashbackConfig(tenantId);
  }

  async updateCashbackConfig(
    tenantId: string,
    input: MenuOnlineUpdateCashbackConfigRequest,
  ): Promise<MenuOnlineCashbackConfigDTO> {
    if (input.percent !== undefined && (input.percent < 0 || input.percent > 100)) {
      throw new Error('INVALID_CASHBACK_CONFIG');
    }
    if (input.expiresDays !== undefined && input.expiresDays !== null && input.expiresDays <= 0) {
      throw new Error('INVALID_CASHBACK_CONFIG');
    }
    return this.repository.updateCashbackConfig(tenantId, input);
  }

  async getCustomerBalance(tenantId: string, customerKey: string): Promise<MenuOnlineCustomerBalanceDTO> {
    return this.repository.getCustomerBalance(tenantId, customerKey);
  }

  async updateCustomerBalance(
    tenantId: string,
    customerKey: string,
    input: { loyaltyPoints?: number; cashbackBalance?: number },
  ): Promise<MenuOnlineCustomerBalanceDTO> {
    if (input.loyaltyPoints !== undefined && input.loyaltyPoints < 0) {
      throw new Error('INVALID_CUSTOMER_BALANCE');
    }
    if (input.cashbackBalance !== undefined && input.cashbackBalance < 0) {
      throw new Error('INVALID_CUSTOMER_BALANCE');
    }
    return this.repository.updateCustomerBalance(tenantId, customerKey, input);
  }
}
