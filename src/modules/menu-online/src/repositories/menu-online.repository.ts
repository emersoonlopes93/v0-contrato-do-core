import { getPrismaClient } from '@/src/adapters/prisma/client';
import { Prisma } from '@prisma/client';
import type {
  MenuOnlineAvailabilityWindow,
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

export class MenuOnlineRepository {
  private readonly prisma = getPrismaClient();

  async getTenantBySlug(slug: string): Promise<{ id: string; name: string; slug: string } | null> {
    const row = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!row) return null;
    return { id: row.id, name: row.name, slug: row.slug };
  }

  async isModuleActiveForTenant(tenantId: string): Promise<boolean> {
    const row = await this.prisma.tenantModule.findFirst({
      where: { tenant_id: tenantId, module_id: 'menu-online', status: 'active' },
      select: { id: true },
    });
    return !!row;
  }

  private toJsonAvailability(
    availability: MenuOnlineAvailabilityWindow[] | null | undefined,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (availability === undefined) return undefined;
    if (availability === null) return Prisma.JsonNull;
    return availability;
  }

  async listCategories(tenantId: string): Promise<MenuOnlineCategoryDTO[]> {
    const rows = await this.prisma.category.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sort_order,
      status: c.status === 'inactive' ? 'inactive' : 'active',
      availability: this.parseAvailability(c.availability),
      visibleDelivery: c.visible_delivery,
      visibleCounter: c.visible_counter,
      visibleTable: c.visible_table,
    }));
  }

  async createCategory(tenantId: string, input: MenuOnlineCreateCategoryRequest): Promise<MenuOnlineCategoryDTO> {
    const row = await this.prisma.category.create({
      data: {
        tenant_id: tenantId,
        name: input.name,
        description: input.description ?? null,
        sort_order: input.sortOrder ?? 0,
        status: input.status ?? 'active',
        availability: this.toJsonAvailability(input.availability),
        visible_delivery: input.visibleDelivery ?? true,
        visible_counter: input.visibleCounter ?? true,
        visible_table: input.visibleTable ?? true,
      },
    });

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
      availability: this.parseAvailability(row.availability),
      visibleDelivery: row.visible_delivery,
      visibleCounter: row.visible_counter,
      visibleTable: row.visible_table,
    };
  }

  async updateCategory(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateCategoryRequest,
  ): Promise<MenuOnlineCategoryDTO | null> {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) return null;

    const row = await this.prisma.category.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        sort_order: input.sortOrder ?? undefined,
        status: input.status ?? undefined,
        availability: this.toJsonAvailability(input.availability),
        visible_delivery: input.visibleDelivery ?? undefined,
        visible_counter: input.visibleCounter ?? undefined,
        visible_table: input.visibleTable ?? undefined,
      },
    });

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
      availability: this.parseAvailability(row.availability),
      visibleDelivery: row.visible_delivery,
      visibleCounter: row.visible_counter,
      visibleTable: row.visible_table,
    };
  }

  async deleteCategory(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.category.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async listProducts(tenantId: string): Promise<MenuOnlineProductDTO[]> {
    const rows = await this.prisma.product.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      include: {
        images: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        priceVariations: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
        productModifiers: {
          where: { deleted_at: null },
          select: { group_id: true },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });

    return rows.map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      status: p.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: p.sort_order,
      basePrice: p.base_price,
      promoPrice: p.promo_price ?? null,
      promoStartsAt: p.promo_starts_at ? p.promo_starts_at.toISOString() : null,
      promoEndsAt: p.promo_ends_at ? p.promo_ends_at.toISOString() : null,
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
      })),
      priceVariations: p.priceVariations.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        priceDelta: v.price_delta ?? 0,
        isDefault: v.is_default,
        sortOrder: v.sort_order,
        status: v.status === 'inactive' ? 'inactive' : 'active',
      })),
      modifierGroupIds: p.productModifiers.map((pm) => pm.group_id),
    }));
  }

  async createProduct(tenantId: string, input: MenuOnlineCreateProductRequest): Promise<MenuOnlineProductDTO> {
    const row = await this.prisma.product.create({
      data: {
        tenant_id: tenantId,
        category_id: input.categoryId,
        sku: input.sku ?? null,
        name: input.name,
        description: input.description ?? null,
        status: input.status ?? 'active',
        sort_order: input.sortOrder ?? 0,
        base_price: input.basePrice ?? 0,
        promo_price: input.promoPrice ?? null,
        promo_starts_at: input.promoStartsAt ? new Date(input.promoStartsAt) : null,
        promo_ends_at: input.promoEndsAt ? new Date(input.promoEndsAt) : null,
      },
    });

    const images = input.images ?? [];
    if (images.length > 0) {
      await this.prisma.productImage.createMany({
        data: images.map((img) => ({
          tenant_id: tenantId,
          product_id: row.id,
          url: img.url,
          alt_text: img.altText ?? null,
          sort_order: img.sortOrder ?? 0,
        })),
      });
    }

    const variations = input.priceVariations ?? [];
    if (variations.length > 0) {
      await this.prisma.priceVariation.createMany({
        data: variations.map((v) => ({
          tenant_id: tenantId,
          product_id: row.id,
          name: v.name,
          price: v.price,
          price_delta: v.priceDelta ?? null,
          is_default: v.isDefault ?? false,
          sort_order: v.sortOrder ?? 0,
          status: v.status ?? 'active',
        })),
      });
    }

    const groupIds = input.modifierGroupIds ?? [];
    if (groupIds.length > 0) {
      await this.prisma.productModifier.createMany({
        data: groupIds.map((groupId, index) => ({
          tenant_id: tenantId,
          product_id: row.id,
          group_id: groupId,
          sort_order: index,
        })),
        skipDuplicates: true,
      });
    }

    const created = await this.prisma.product.findUnique({
      where: { id: row.id },
      include: {
        images: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        priceVariations: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
        productModifiers: {
          where: { deleted_at: null },
          select: { group_id: true },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });

    if (!created) {
      return {
        id: row.id,
        categoryId: row.category_id,
        sku: row.sku,
        name: row.name,
        description: row.description,
        status: row.status === 'inactive' ? 'inactive' : 'active',
        sortOrder: row.sort_order,
        basePrice: row.base_price,
        promoPrice: row.promo_price ?? null,
        promoStartsAt: row.promo_starts_at ? row.promo_starts_at.toISOString() : null,
        promoEndsAt: row.promo_ends_at ? row.promo_ends_at.toISOString() : null,
        images: [],
        priceVariations: [],
        modifierGroupIds: [],
      };
    }

    return {
      id: created.id,
      categoryId: created.category_id,
      sku: created.sku,
      name: created.name,
      description: created.description,
      status: created.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: created.sort_order,
      basePrice: created.base_price,
      promoPrice: created.promo_price ?? null,
      promoStartsAt: created.promo_starts_at ? created.promo_starts_at.toISOString() : null,
      promoEndsAt: created.promo_ends_at ? created.promo_ends_at.toISOString() : null,
      images: created.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
      })),
      priceVariations: created.priceVariations.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        priceDelta: v.price_delta ?? 0,
        isDefault: v.is_default,
        sortOrder: v.sort_order,
        status: v.status === 'inactive' ? 'inactive' : 'active',
      })),
      modifierGroupIds: created.productModifiers.map((pm) => pm.group_id),
    };
  }

  async updateProduct(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateProductRequest,
  ): Promise<MenuOnlineProductDTO | null> {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return null;

    await this.prisma.product.update({
      where: { id },
      data: {
        category_id: input.categoryId ?? undefined,
        sku: input.sku ?? undefined,
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        status: input.status ?? undefined,
        sort_order: input.sortOrder ?? undefined,
        base_price: input.basePrice ?? undefined,
        promo_price: input.promoPrice ?? undefined,
        promo_starts_at: input.promoStartsAt ? new Date(input.promoStartsAt) : undefined,
        promo_ends_at: input.promoEndsAt ? new Date(input.promoEndsAt) : undefined,
      },
    });

    if (input.images) {
      await this.prisma.productImage.deleteMany({ where: { tenant_id: tenantId, product_id: id } });
      if (input.images.length > 0) {
        await this.prisma.productImage.createMany({
          data: input.images.map((img) => ({
            tenant_id: tenantId,
            product_id: id,
            url: img.url,
            alt_text: img.altText ?? null,
            sort_order: img.sortOrder ?? 0,
          })),
        });
      }
    }

    if (input.priceVariations) {
      await this.prisma.priceVariation.deleteMany({ where: { tenant_id: tenantId, product_id: id } });
      if (input.priceVariations.length > 0) {
        await this.prisma.priceVariation.createMany({
          data: input.priceVariations.map((v) => ({
            tenant_id: tenantId,
            product_id: id,
            name: v.name,
            price: v.price,
            price_delta: v.priceDelta ?? null,
            is_default: v.isDefault ?? false,
            sort_order: v.sortOrder ?? 0,
            status: v.status ?? 'active',
          })),
        });
      }
    }

    if (input.modifierGroupIds) {
      await this.prisma.productModifier.deleteMany({ where: { tenant_id: tenantId, product_id: id } });
      if (input.modifierGroupIds.length > 0) {
        await this.prisma.productModifier.createMany({
          data: input.modifierGroupIds.map((groupId, index) => ({
            tenant_id: tenantId,
            product_id: id,
            group_id: groupId,
            sort_order: index,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        priceVariations: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
        productModifiers: {
          where: { deleted_at: null },
          select: { group_id: true },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });

    if (!updated) return null;

    return {
      id: updated.id,
      categoryId: updated.category_id,
      sku: updated.sku,
      name: updated.name,
      description: updated.description,
      status: updated.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: updated.sort_order,
      basePrice: updated.base_price,
      promoPrice: updated.promo_price ?? null,
      promoStartsAt: updated.promo_starts_at ? updated.promo_starts_at.toISOString() : null,
      promoEndsAt: updated.promo_ends_at ? updated.promo_ends_at.toISOString() : null,
      images: updated.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
      })),
      priceVariations: updated.priceVariations.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        priceDelta: v.price_delta ?? 0,
        isDefault: v.is_default,
        sortOrder: v.sort_order,
        status: v.status === 'inactive' ? 'inactive' : 'active',
      })),
      modifierGroupIds: updated.productModifiers.map((pm) => pm.group_id),
    };
  }

  async deleteProduct(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.product.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async listModifierGroups(tenantId: string): Promise<MenuOnlineModifierGroupDTO[]> {
    const rows = await this.prisma.modifierGroup.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      isRequired: g.is_required,
      sortOrder: g.sort_order,
      status: g.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async createModifierGroup(
    tenantId: string,
    input: MenuOnlineCreateModifierGroupRequest,
  ): Promise<MenuOnlineModifierGroupDTO> {
    const row = await this.prisma.modifierGroup.create({
      data: {
        tenant_id: tenantId,
        name: input.name,
        description: input.description ?? null,
        min_select: input.minSelect ?? 0,
        max_select: input.maxSelect ?? 1,
        is_required: input.isRequired ?? false,
        sort_order: input.sortOrder ?? 0,
        status: input.status ?? 'active',
      },
    });

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      minSelect: row.min_select,
      maxSelect: row.max_select,
      isRequired: row.is_required,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async updateModifierGroup(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateModifierGroupRequest,
  ): Promise<MenuOnlineModifierGroupDTO | null> {
    const existing = await this.prisma.modifierGroup.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.modifierGroup.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        min_select: input.minSelect ?? undefined,
        max_select: input.maxSelect ?? undefined,
        is_required: input.isRequired ?? undefined,
        sort_order: input.sortOrder ?? undefined,
        status: input.status ?? undefined,
      },
    });

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      minSelect: row.min_select,
      maxSelect: row.max_select,
      isRequired: row.is_required,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async deleteModifierGroup(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.modifierGroup.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.modifierGroup.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async listModifierOptions(tenantId: string, groupId: string): Promise<MenuOnlineModifierOptionDTO[]> {
    const rows = await this.prisma.modifierOption.findMany({
      where: { tenant_id: tenantId, group_id: groupId, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });

    return rows.map((o) => ({
      id: o.id,
      groupId: o.group_id,
      name: o.name,
      priceDelta: o.price_delta,
      sortOrder: o.sort_order,
      status: o.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async createModifierOption(
    tenantId: string,
    input: MenuOnlineCreateModifierOptionRequest,
  ): Promise<MenuOnlineModifierOptionDTO> {
    const row = await this.prisma.modifierOption.create({
      data: {
        tenant_id: tenantId,
        group_id: input.groupId,
        name: input.name,
        price_delta: input.priceDelta ?? 0,
        sort_order: input.sortOrder ?? 0,
        status: input.status ?? 'active',
      },
    });

    return {
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      priceDelta: row.price_delta,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async updateModifierOption(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateModifierOptionRequest,
  ): Promise<MenuOnlineModifierOptionDTO | null> {
    const existing = await this.prisma.modifierOption.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true, group_id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.modifierOption.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        price_delta: input.priceDelta ?? undefined,
        sort_order: input.sortOrder ?? undefined,
        status: input.status ?? undefined,
      },
    });

    return {
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      priceDelta: row.price_delta,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async deleteModifierOption(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.modifierOption.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.modifierOption.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async listCombos(tenantId: string): Promise<MenuOnlineComboDTO[]> {
    const rows = await this.prisma.menuCombo.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ created_at: 'asc' }],
      include: {
        items: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      pricingType: c.pricing_type,
      fixedPrice: c.fixed_price ?? null,
      discountPercent: c.discount_percent ?? null,
      discountAmount: c.discount_amount ?? null,
      status: c.status === 'inactive' ? 'inactive' : 'active',
      items: c.items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        minQty: i.min_qty,
        maxQty: i.max_qty,
        sortOrder: i.sort_order,
        status: i.status === 'inactive' ? 'inactive' : 'active',
      })),
    }));
  }

  async createCombo(tenantId: string, input: MenuOnlineCreateComboRequest): Promise<MenuOnlineComboDTO> {
    // Normalizar e deduplicar itens por productId para evitar violação de unicidade
    const uniqueItems = (() => {
      const seen = new Set<string>();
      const result: Array<{
        productId: string;
        minQty: number;
        maxQty: number;
        sortOrder: number;
        status: 'active' | 'inactive';
      }> = [];
      for (const [index, item] of input.items.entries()) {
        const productId = item.productId;
        if (!productId || seen.has(productId)) continue;
        seen.add(productId);
        const min = item.minQty ?? 1;
        const max = item.maxQty ?? 1;
        const normalizedMin = Math.max(1, Math.min(min, max));
        const normalizedMax = Math.max(normalizedMin, max);
        result.push({
          productId,
          minQty: normalizedMin,
          maxQty: normalizedMax,
          sortOrder: item.sortOrder ?? index,
          status: (item.status ?? 'active') === 'inactive' ? 'inactive' : 'active',
        });
      }
      return result;
    })();

    const row = await this.prisma.menuCombo.create({
      data: {
        tenant_id: tenantId,
        name: input.name,
        description: input.description ?? null,
        pricing_type: input.pricingType,
        fixed_price: input.fixedPrice ?? null,
        discount_percent: input.discountPercent ?? null,
        discount_amount: input.discountAmount ?? null,
        status: input.status ?? 'active',
      },
      select: { id: true },
    });

    if (uniqueItems.length > 0) {
      await this.prisma.menuComboItem.createMany({
        data: uniqueItems.map((item) => ({
          tenant_id: tenantId,
          combo_id: row.id,
          product_id: item.productId,
          min_qty: item.minQty,
          max_qty: item.maxQty,
          sort_order: item.sortOrder,
          status: item.status,
        })),
        skipDuplicates: true,
      });
    }

    const created = await this.prisma.menuCombo.findUnique({
      where: { id: row.id },
      include: {
        items: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });

    if (!created) {
      return {
        id: row.id,
        name: input.name,
        description: input.description ?? null,
        pricingType: input.pricingType,
        fixedPrice: input.fixedPrice ?? null,
        discountPercent: input.discountPercent ?? null,
        discountAmount: input.discountAmount ?? null,
        status: input.status ?? 'active',
        items: [],
      };
    }

    return {
      id: created.id,
      name: created.name,
      description: created.description ?? null,
      pricingType: created.pricing_type,
      fixedPrice: created.fixed_price ?? null,
      discountPercent: created.discount_percent ?? null,
      discountAmount: created.discount_amount ?? null,
      status: created.status === 'inactive' ? 'inactive' : 'active',
      items: created.items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        minQty: i.min_qty,
        maxQty: i.max_qty,
        sortOrder: i.sort_order,
        status: i.status === 'inactive' ? 'inactive' : 'active',
      })),
    };
  }

  async updateCombo(tenantId: string, id: string, input: MenuOnlineUpdateComboRequest): Promise<MenuOnlineComboDTO | null> {
    const existing = await this.prisma.menuCombo.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return null;

    await this.prisma.menuCombo.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        pricing_type: input.pricingType ?? undefined,
        fixed_price: input.fixedPrice ?? undefined,
        discount_percent: input.discountPercent ?? undefined,
        discount_amount: input.discountAmount ?? undefined,
        status: input.status ?? undefined,
      },
    });

    if (input.items) {
      const incomingProductIds = new Set<string>();
      for (const item of input.items) {
        incomingProductIds.add(item.productId);
        if (item.id) {
          await this.prisma.menuComboItem.updateMany({
            where: { id: item.id, tenant_id: tenantId, combo_id: id },
            data: {
              product_id: item.productId,
              min_qty: item.minQty ?? undefined,
              max_qty: item.maxQty ?? undefined,
              sort_order: item.sortOrder ?? undefined,
              status: item.status ?? undefined,
              deleted_at: null,
            },
          });
          continue;
        }

        const existingItem = await this.prisma.menuComboItem.findFirst({
          where: { tenant_id: tenantId, combo_id: id, product_id: item.productId },
          select: { id: true },
        });

        if (existingItem) {
          await this.prisma.menuComboItem.update({
            where: { id: existingItem.id },
            data: {
              min_qty: item.minQty ?? 1,
              max_qty: item.maxQty ?? 1,
              sort_order: item.sortOrder ?? 0,
              status: item.status ?? 'active',
              deleted_at: null,
            },
          });
        } else {
          await this.prisma.menuComboItem.create({
            data: {
              tenant_id: tenantId,
              combo_id: id,
              product_id: item.productId,
              min_qty: item.minQty ?? 1,
              max_qty: item.maxQty ?? 1,
              sort_order: item.sortOrder ?? 0,
              status: item.status ?? 'active',
            },
          });
        }
      }

      const existingItems = await this.prisma.menuComboItem.findMany({
        where: { tenant_id: tenantId, combo_id: id, deleted_at: null },
        select: { id: true, product_id: true },
      });

      const toDelete = existingItems.filter((i) => !incomingProductIds.has(i.product_id)).map((i) => i.id);
      if (toDelete.length > 0) {
        await this.prisma.menuComboItem.updateMany({
          where: { id: { in: toDelete }, tenant_id: tenantId },
          data: { deleted_at: new Date() },
        });
      }
    }

    const updated = await this.prisma.menuCombo.findUnique({
      where: { id },
      include: {
        items: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    });
    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? null,
      pricingType: updated.pricing_type,
      fixedPrice: updated.fixed_price ?? null,
      discountPercent: updated.discount_percent ?? null,
      discountAmount: updated.discount_amount ?? null,
      status: updated.status === 'inactive' ? 'inactive' : 'active',
      items: updated.items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        minQty: i.min_qty,
        maxQty: i.max_qty,
        sortOrder: i.sort_order,
        status: i.status === 'inactive' ? 'inactive' : 'active',
      })),
    };
  }

  async deleteCombo(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.menuCombo.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;
    await this.prisma.menuCombo.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async listCoupons(tenantId: string): Promise<MenuOnlineCouponDTO[]> {
    const rows = await this.prisma.menuCoupon.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ created_at: 'asc' }],
    });

    return rows.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      startsAt: c.starts_at ? c.starts_at.toISOString() : null,
      endsAt: c.ends_at ? c.ends_at.toISOString() : null,
      maxUsesTotal: c.max_uses_total ?? null,
      maxUsesPerCustomer: c.max_uses_per_customer ?? null,
      status: c.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async createCoupon(tenantId: string, input: MenuOnlineCreateCouponRequest): Promise<MenuOnlineCouponDTO> {
    const row = await this.prisma.menuCoupon.create({
      data: {
        tenant_id: tenantId,
        code: input.code,
        type: input.type,
        value: input.value,
        starts_at: input.startsAt ? new Date(input.startsAt) : null,
        ends_at: input.endsAt ? new Date(input.endsAt) : null,
        max_uses_total: input.maxUsesTotal ?? null,
        max_uses_per_customer: input.maxUsesPerCustomer ?? null,
        status: input.status ?? 'active',
      },
    });

    return {
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      startsAt: row.starts_at ? row.starts_at.toISOString() : null,
      endsAt: row.ends_at ? row.ends_at.toISOString() : null,
      maxUsesTotal: row.max_uses_total ?? null,
      maxUsesPerCustomer: row.max_uses_per_customer ?? null,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async updateCoupon(tenantId: string, id: string, input: MenuOnlineUpdateCouponRequest): Promise<MenuOnlineCouponDTO | null> {
    const existing = await this.prisma.menuCoupon.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.menuCoupon.update({
      where: { id },
      data: {
        code: input.code ?? undefined,
        type: input.type ?? undefined,
        value: input.value ?? undefined,
        starts_at: input.startsAt ? new Date(input.startsAt) : undefined,
        ends_at: input.endsAt ? new Date(input.endsAt) : undefined,
        max_uses_total: input.maxUsesTotal ?? undefined,
        max_uses_per_customer: input.maxUsesPerCustomer ?? undefined,
        status: input.status ?? undefined,
      },
    });

    return {
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      startsAt: row.starts_at ? row.starts_at.toISOString() : null,
      endsAt: row.ends_at ? row.ends_at.toISOString() : null,
      maxUsesTotal: row.max_uses_total ?? null,
      maxUsesPerCustomer: row.max_uses_per_customer ?? null,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async deleteCoupon(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.menuCoupon.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;
    await this.prisma.menuCoupon.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async findCouponByCode(tenantId: string, code: string): Promise<{
    id: string;
    type: MenuOnlineCouponDTO['type'];
    value: number;
    startsAt: Date | null;
    endsAt: Date | null;
    maxUsesTotal: number | null;
    maxUsesPerCustomer: number | null;
    status: MenuOnlineCouponDTO['status'];
  } | null> {
    const row = await this.prisma.menuCoupon.findFirst({
      where: { tenant_id: tenantId, code, deleted_at: null },
      select: {
        id: true,
        type: true,
        value: true,
        starts_at: true,
        ends_at: true,
        max_uses_total: true,
        max_uses_per_customer: true,
        status: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      value: row.value,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      maxUsesTotal: row.max_uses_total ?? null,
      maxUsesPerCustomer: row.max_uses_per_customer ?? null,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async countCouponRedemptions(couponId: string): Promise<number> {
    return this.prisma.menuCouponRedemption.count({ where: { coupon_id: couponId } });
  }

  async countCouponRedemptionsByCustomer(couponId: string, customerKey: string): Promise<number> {
    return this.prisma.menuCouponRedemption.count({ where: { coupon_id: couponId, customer_key: customerKey } });
  }

  async getProductPricingInputs(tenantId: string, productId: string): Promise<{
    basePrice: number;
    promoPrice: number | null;
    promoStartsAt: Date | null;
    promoEndsAt: Date | null;
  } | null> {
    const row = await this.prisma.product.findFirst({
      where: { id: productId, tenant_id: tenantId, deleted_at: null, status: 'active' },
      select: { base_price: true, promo_price: true, promo_starts_at: true, promo_ends_at: true },
    });
    if (!row) return null;
    return {
      basePrice: row.base_price,
      promoPrice: row.promo_price ?? null,
      promoStartsAt: row.promo_starts_at,
      promoEndsAt: row.promo_ends_at,
    };
  }

  async getVariationPricingInputs(
    tenantId: string,
    productId: string,
    variationId: string,
  ): Promise<{ price: number; priceDelta: number | null } | null> {
    const row = await this.prisma.priceVariation.findFirst({
      where: { id: variationId, tenant_id: tenantId, product_id: productId, deleted_at: null, status: 'active' },
      select: { price: true, price_delta: true },
    });
    if (!row) return null;
    return { price: row.price, priceDelta: row.price_delta ?? null };
  }

  async sumModifierOptionsPriceDelta(tenantId: string, optionIds: string[]): Promise<number> {
    if (optionIds.length === 0) return 0;
    const rows = await this.prisma.modifierOption.findMany({
      where: { tenant_id: tenantId, id: { in: optionIds }, deleted_at: null, status: 'active' },
      select: { price_delta: true },
    });
    return rows.reduce((acc, r) => acc + r.price_delta, 0);
  }

  async getProductModifierGroupRules(
    tenantId: string,
    productId: string,
  ): Promise<
    Array<{
      groupId: string;
      minSelect: number;
      maxSelect: number;
      isRequired: boolean;
      status: 'active' | 'inactive';
    }>
  > {
    const rows = await this.prisma.productModifier.findMany({
      where: { tenant_id: tenantId, product_id: productId, deleted_at: null },
      select: {
        group_id: true,
        group: {
          select: {
            min_select: true,
            max_select: true,
            is_required: true,
            status: true,
            deleted_at: true,
          },
        },
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });

    return rows
      .filter((row) => row.group && row.group.deleted_at === null)
      .map((row) => ({
        groupId: row.group_id,
        minSelect: row.group.min_select,
        maxSelect: row.group.max_select,
        isRequired: row.group.is_required,
        status: row.group.status === 'inactive' ? 'inactive' : 'active',
      }));
  }

  async getModifierOptionsByIds(
    tenantId: string,
    optionIds: string[],
  ): Promise<
    Array<{
      id: string;
      groupId: string;
      priceDelta: number;
      status: 'active' | 'inactive';
    }>
  > {
    if (optionIds.length === 0) return [];
    const rows = await this.prisma.modifierOption.findMany({
      where: { tenant_id: tenantId, id: { in: optionIds }, deleted_at: null },
      select: { id: true, group_id: true, price_delta: true, status: true },
    });
    return rows.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      priceDelta: row.price_delta,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async listUpsellSuggestions(tenantId: string): Promise<MenuOnlineUpsellSuggestionDTO[]> {
    const rows = await this.prisma.menuUpsellSuggestion.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    return rows.map((s) => ({
      id: s.id,
      fromProductId: s.from_product_id ?? null,
      suggestedProductId: s.suggested_product_id,
      sortOrder: s.sort_order,
      status: s.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async createUpsellSuggestion(
    tenantId: string,
    input: MenuOnlineCreateUpsellSuggestionRequest,
  ): Promise<MenuOnlineUpsellSuggestionDTO> {
    const row = await this.prisma.menuUpsellSuggestion.create({
      data: {
        tenant_id: tenantId,
        from_product_id: input.fromProductId ?? null,
        suggested_product_id: input.suggestedProductId,
        sort_order: input.sortOrder ?? 0,
        status: input.status ?? 'active',
      },
    });

    return {
      id: row.id,
      fromProductId: row.from_product_id ?? null,
      suggestedProductId: row.suggested_product_id,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async updateUpsellSuggestion(
    tenantId: string,
    id: string,
    input: MenuOnlineUpdateUpsellSuggestionRequest,
  ): Promise<MenuOnlineUpsellSuggestionDTO | null> {
    const existing = await this.prisma.menuUpsellSuggestion.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.menuUpsellSuggestion.update({
      where: { id },
      data: {
        from_product_id: input.fromProductId ?? undefined,
        suggested_product_id: input.suggestedProductId ?? undefined,
        sort_order: input.sortOrder ?? undefined,
        status: input.status ?? undefined,
      },
    });

    return {
      id: row.id,
      fromProductId: row.from_product_id ?? null,
      suggestedProductId: row.suggested_product_id,
      sortOrder: row.sort_order,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  }

  async deleteUpsellSuggestion(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.prisma.menuUpsellSuggestion.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.menuUpsellSuggestion.update({ where: { id }, data: { deleted_at: new Date() } });
    return true;
  }

  async getLoyaltyConfig(tenantId: string): Promise<MenuOnlineLoyaltyConfigDTO> {
    const row = await this.prisma.menuLoyaltyConfig.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!row) {
      return { enabled: false, pointsPerCurrency: 0, currencyPerPoint: 0 };
    }
    return {
      enabled: row.enabled,
      pointsPerCurrency: row.points_per_currency,
      currencyPerPoint: row.currency_per_point,
    };
  }

  async updateLoyaltyConfig(
    tenantId: string,
    input: MenuOnlineUpdateLoyaltyConfigRequest,
  ): Promise<MenuOnlineLoyaltyConfigDTO> {
    const row = await this.prisma.menuLoyaltyConfig.upsert({
      where: { tenant_id: tenantId },
      update: {
        enabled: input.enabled ?? undefined,
        points_per_currency: input.pointsPerCurrency ?? undefined,
        currency_per_point: input.currencyPerPoint ?? undefined,
      },
      create: {
        tenant_id: tenantId,
        enabled: input.enabled ?? false,
        points_per_currency: input.pointsPerCurrency ?? 0,
        currency_per_point: input.currencyPerPoint ?? 0,
      },
    });
    return {
      enabled: row.enabled,
      pointsPerCurrency: row.points_per_currency,
      currencyPerPoint: row.currency_per_point,
    };
  }

  async getCashbackConfig(tenantId: string): Promise<MenuOnlineCashbackConfigDTO> {
    const row = await this.prisma.menuCashbackConfig.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!row) {
      return { enabled: false, percent: 0, expiresDays: null };
    }
    return {
      enabled: row.enabled,
      percent: row.percent,
      expiresDays: row.expires_days ?? null,
    };
  }

  async updateCashbackConfig(
    tenantId: string,
    input: MenuOnlineUpdateCashbackConfigRequest,
  ): Promise<MenuOnlineCashbackConfigDTO> {
    const row = await this.prisma.menuCashbackConfig.upsert({
      where: { tenant_id: tenantId },
      update: {
        enabled: input.enabled ?? undefined,
        percent: input.percent ?? undefined,
        expires_days: input.expiresDays === undefined ? undefined : input.expiresDays,
      },
      create: {
        tenant_id: tenantId,
        enabled: input.enabled ?? false,
        percent: input.percent ?? 0,
        expires_days: input.expiresDays === undefined ? null : input.expiresDays,
      },
    });
    return {
      enabled: row.enabled,
      percent: row.percent,
      expiresDays: row.expires_days ?? null,
    };
  }

  async getCustomerBalance(tenantId: string, customerKey: string): Promise<MenuOnlineCustomerBalanceDTO> {
    const row = await this.prisma.menuCustomerBalance.findUnique({
      where: { tenant_id_customer_key: { tenant_id: tenantId, customer_key: customerKey } },
    });
    if (!row) {
      return { customerKey, loyaltyPoints: 0, cashbackBalance: 0 };
    }
    return {
      customerKey: row.customer_key,
      loyaltyPoints: row.loyalty_points,
      cashbackBalance: row.cashback_balance,
    };
  }

  async updateCustomerBalance(
    tenantId: string,
    customerKey: string,
    input: { loyaltyPoints?: number; cashbackBalance?: number },
  ): Promise<MenuOnlineCustomerBalanceDTO> {
    const row = await this.prisma.menuCustomerBalance.upsert({
      where: { tenant_id_customer_key: { tenant_id: tenantId, customer_key: customerKey } },
      update: {
        loyalty_points: input.loyaltyPoints ?? undefined,
        cashback_balance: input.cashbackBalance ?? undefined,
      },
      create: {
        tenant_id: tenantId,
        customer_key: customerKey,
        loyalty_points: input.loyaltyPoints ?? 0,
        cashback_balance: input.cashbackBalance ?? 0,
      },
    });
    return {
      customerKey: row.customer_key,
      loyaltyPoints: row.loyalty_points,
      cashbackBalance: row.cashback_balance,
    };
  }

  async getSettings(tenantId: string): Promise<MenuOnlineSettingsDTO> {
    const row = await this.prisma.menuSettings.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!row) {
      return {
        currency: 'BRL',
        showOutOfStock: false,
        showImages: true,
      };
    }

    return {
      currency: row.currency,
      showOutOfStock: row.show_out_of_stock,
      showImages: row.show_images,
    };
  }

  async updateSettings(tenantId: string, input: MenuOnlineUpdateSettingsRequest): Promise<MenuOnlineSettingsDTO> {
    const row = await this.prisma.menuSettings.upsert({
      where: { tenant_id: tenantId },
      update: {
        currency: input.currency ?? undefined,
        show_out_of_stock: input.showOutOfStock ?? undefined,
        show_images: input.showImages ?? undefined,
      },
      create: {
        tenant_id: tenantId,
        currency: input.currency ?? 'BRL',
        show_out_of_stock: input.showOutOfStock ?? false,
        show_images: input.showImages ?? true,
      },
    });

    return {
      currency: row.currency,
      showOutOfStock: row.show_out_of_stock,
      showImages: row.show_images,
    };
  }

  private parseAvailability(value: unknown): MenuOnlineAvailabilityWindow[] | null {
    if (value === null || value === undefined) return null;
    if (!Array.isArray(value)) return null;
    const windows: MenuOnlineAvailabilityWindow[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const days = record.days;
      const start = record.start;
      const end = record.end;
      if (!Array.isArray(days)) continue;
      const normalizedDays = days.filter((d): d is number => typeof d === 'number' && Number.isInteger(d));
      if (typeof start !== 'string' || typeof end !== 'string') continue;
      windows.push({ days: normalizedDays, start, end });
    }
    return windows.length > 0 ? windows : [];
  }


}
