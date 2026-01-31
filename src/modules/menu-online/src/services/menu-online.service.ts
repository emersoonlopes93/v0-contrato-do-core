import type { ModuleContext } from '@/src/core/modules/contracts';
import type {
  MenuOnlineCategoryDTO,
  MenuOnlineComboDTO,
  MenuOnlineCouponDTO,
  MenuOnlineCreateCategoryRequest,
  MenuOnlineCreateComboRequest,
  MenuOnlineCreateCouponRequest,
  MenuOnlineCreateModifierGroupRequest,
  MenuOnlineCreateModifierOptionRequest,
  MenuOnlineCreateProductRequest,
  MenuOnlineModifierGroupDTO,
  MenuOnlineModifierOptionDTO,
  MenuOnlinePriceSimulationRequest,
  MenuOnlinePriceSimulationResponse,
  MenuOnlineProductDTO,
  MenuOnlineSettingsDTO,
  MenuOnlineUpdateCategoryRequest,
  MenuOnlineUpdateComboRequest,
  MenuOnlineUpdateCouponRequest,
  MenuOnlineUpdateModifierGroupRequest,
  MenuOnlineUpdateModifierOptionRequest,
  MenuOnlineUpdateProductRequest,
  MenuOnlineUpdateSettingsRequest,
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
      }
    }

    const modifierOptionIds = input.modifierOptionIds ?? [];
    const modifiersTotal = await this.repository.sumModifierOptionsPriceDelta(tenantId, modifierOptionIds);

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
}
