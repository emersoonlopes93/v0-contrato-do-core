-- CreateEnum
CREATE TYPE "MenuCouponType" AS ENUM ('percent', 'fixed');

-- CreateEnum
CREATE TYPE "MenuComboPricingType" AS ENUM ('fixed_price', 'discount_percent', 'discount_amount');

-- CreateTable
CREATE TABLE "menu_online_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "availability" JSONB,
    "visible_delivery" BOOLEAN NOT NULL DEFAULT true,
    "visible_counter" BOOLEAN NOT NULL DEFAULT true,
    "visible_table" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "base_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promo_price" DOUBLE PRECISION,
    "promo_starts_at" TIMESTAMP(3),
    "promo_ends_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_product_images" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_price_variations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "price_delta" DOUBLE PRECISION DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_price_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_modifier_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "min_select" INTEGER NOT NULL DEFAULT 0,
    "max_select" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_modifier_options" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_product_modifiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_product_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "show_out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "show_images" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_upsell_suggestions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_product_id" TEXT,
    "suggested_product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_upsell_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_combos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricing_type" "MenuComboPricingType" NOT NULL,
    "fixed_price" DOUBLE PRECISION,
    "discount_percent" DOUBLE PRECISION,
    "discount_amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_combo_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "min_qty" INTEGER NOT NULL DEFAULT 1,
    "max_qty" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_coupons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "MenuCouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "max_uses_total" INTEGER,
    "max_uses_per_customer" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_coupon_redemptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "customer_key" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_online_coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_loyalty_config" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "points_per_currency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency_per_point" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_loyalty_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_cashback_config" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expires_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_cashback_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_online_customer_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_key" TEXT NOT NULL,
    "loyalty_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashback_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_online_customer_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_online_categories_tenant_id_idx" ON "menu_online_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_products_tenant_id_idx" ON "menu_online_products"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_products_category_id_idx" ON "menu_online_products"("category_id");

-- CreateIndex
CREATE INDEX "menu_online_product_images_tenant_id_idx" ON "menu_online_product_images"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_product_images_product_id_idx" ON "menu_online_product_images"("product_id");

-- CreateIndex
CREATE INDEX "menu_online_price_variations_tenant_id_idx" ON "menu_online_price_variations"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_price_variations_product_id_idx" ON "menu_online_price_variations"("product_id");

-- CreateIndex
CREATE INDEX "menu_online_modifier_groups_tenant_id_idx" ON "menu_online_modifier_groups"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_modifier_options_tenant_id_idx" ON "menu_online_modifier_options"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_modifier_options_group_id_idx" ON "menu_online_modifier_options"("group_id");

-- CreateIndex
CREATE INDEX "menu_online_product_modifiers_tenant_id_idx" ON "menu_online_product_modifiers"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_product_modifiers_product_id_idx" ON "menu_online_product_modifiers"("product_id");

-- CreateIndex
CREATE INDEX "menu_online_product_modifiers_group_id_idx" ON "menu_online_product_modifiers"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_product_modifiers_tenant_id_product_id_group_id_key" ON "menu_online_product_modifiers"("tenant_id", "product_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_settings_tenant_id_key" ON "menu_online_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_settings_tenant_id_idx" ON "menu_online_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_upsell_suggestions_tenant_id_idx" ON "menu_online_upsell_suggestions"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_upsell_suggestions_from_product_id_idx" ON "menu_online_upsell_suggestions"("from_product_id");

-- CreateIndex
CREATE INDEX "menu_online_upsell_suggestions_suggested_product_id_idx" ON "menu_online_upsell_suggestions"("suggested_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_upsell_suggestions_tenant_id_from_product_id_su_key" ON "menu_online_upsell_suggestions"("tenant_id", "from_product_id", "suggested_product_id");

-- CreateIndex
CREATE INDEX "menu_online_combos_tenant_id_idx" ON "menu_online_combos"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_combo_items_tenant_id_idx" ON "menu_online_combo_items"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_combo_items_combo_id_idx" ON "menu_online_combo_items"("combo_id");

-- CreateIndex
CREATE INDEX "menu_online_combo_items_product_id_idx" ON "menu_online_combo_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_combo_items_tenant_id_combo_id_product_id_key" ON "menu_online_combo_items"("tenant_id", "combo_id", "product_id");

-- CreateIndex
CREATE INDEX "menu_online_coupons_tenant_id_idx" ON "menu_online_coupons"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_coupons_code_idx" ON "menu_online_coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_coupons_tenant_id_code_key" ON "menu_online_coupons"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "menu_online_coupon_redemptions_tenant_id_idx" ON "menu_online_coupon_redemptions"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_coupon_redemptions_coupon_id_idx" ON "menu_online_coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "menu_online_coupon_redemptions_customer_key_idx" ON "menu_online_coupon_redemptions"("customer_key");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_loyalty_config_tenant_id_key" ON "menu_online_loyalty_config"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_loyalty_config_tenant_id_idx" ON "menu_online_loyalty_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_cashback_config_tenant_id_key" ON "menu_online_cashback_config"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_cashback_config_tenant_id_idx" ON "menu_online_cashback_config"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_customer_balances_tenant_id_idx" ON "menu_online_customer_balances"("tenant_id");

-- CreateIndex
CREATE INDEX "menu_online_customer_balances_customer_key_idx" ON "menu_online_customer_balances"("customer_key");

-- CreateIndex
CREATE UNIQUE INDEX "menu_online_customer_balances_tenant_id_customer_key_key" ON "menu_online_customer_balances"("tenant_id", "customer_key");

-- AddForeignKey
ALTER TABLE "menu_online_categories" ADD CONSTRAINT "menu_online_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_products" ADD CONSTRAINT "menu_online_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_products" ADD CONSTRAINT "menu_online_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_online_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_product_images" ADD CONSTRAINT "menu_online_product_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_product_images" ADD CONSTRAINT "menu_online_product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_price_variations" ADD CONSTRAINT "menu_online_price_variations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_price_variations" ADD CONSTRAINT "menu_online_price_variations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_modifier_groups" ADD CONSTRAINT "menu_online_modifier_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_modifier_options" ADD CONSTRAINT "menu_online_modifier_options_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_modifier_options" ADD CONSTRAINT "menu_online_modifier_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "menu_online_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_product_modifiers" ADD CONSTRAINT "menu_online_product_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_product_modifiers" ADD CONSTRAINT "menu_online_product_modifiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_product_modifiers" ADD CONSTRAINT "menu_online_product_modifiers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "menu_online_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_settings" ADD CONSTRAINT "menu_online_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_upsell_suggestions" ADD CONSTRAINT "menu_online_upsell_suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_upsell_suggestions" ADD CONSTRAINT "menu_online_upsell_suggestions_from_product_id_fkey" FOREIGN KEY ("from_product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_upsell_suggestions" ADD CONSTRAINT "menu_online_upsell_suggestions_suggested_product_id_fkey" FOREIGN KEY ("suggested_product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_combos" ADD CONSTRAINT "menu_online_combos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_combo_items" ADD CONSTRAINT "menu_online_combo_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_combo_items" ADD CONSTRAINT "menu_online_combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "menu_online_combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_combo_items" ADD CONSTRAINT "menu_online_combo_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "menu_online_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_coupons" ADD CONSTRAINT "menu_online_coupons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_coupon_redemptions" ADD CONSTRAINT "menu_online_coupon_redemptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_coupon_redemptions" ADD CONSTRAINT "menu_online_coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "menu_online_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_loyalty_config" ADD CONSTRAINT "menu_online_loyalty_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_cashback_config" ADD CONSTRAINT "menu_online_cashback_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_online_customer_balances" ADD CONSTRAINT "menu_online_customer_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
