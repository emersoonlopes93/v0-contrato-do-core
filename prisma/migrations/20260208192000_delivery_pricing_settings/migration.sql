-- CreateTable
CREATE TABLE "delivery_pricing_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "base_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_per_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_km" DOUBLE PRECISION,
    "min_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additional_per_minute" DOUBLE PRECISION,
    "region_multipliers" JSONB,
    "time_multipliers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_pricing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_pricing_settings_tenant_id_key" ON "delivery_pricing_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_pricing_settings_tenant_id_idx" ON "delivery_pricing_settings"("tenant_id");

-- AddForeignKey
ALTER TABLE "delivery_pricing_settings" ADD CONSTRAINT "delivery_pricing_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
