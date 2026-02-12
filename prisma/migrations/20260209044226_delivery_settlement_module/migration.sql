-- CreateTable
CREATE TABLE "delivery_settlements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "delivery_fee" DOUBLE PRECISION NOT NULL,
    "driver_amount" DOUBLE PRECISION NOT NULL,
    "store_amount" DOUBLE PRECISION NOT NULL,
    "platform_amount" DOUBLE PRECISION NOT NULL,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_settlement_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "driver_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driver_fixed_per_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driver_minimum_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driver_maximum_amount" DOUBLE PRECISION,
    "store_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platform_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_settlement_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_tracking_tokens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "public_tracking_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_settlements_order_id_key" ON "delivery_settlements"("order_id");

-- CreateIndex
CREATE INDEX "delivery_settlements_tenant_id_idx" ON "delivery_settlements"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_settlements_order_id_idx" ON "delivery_settlements"("order_id");

-- CreateIndex
CREATE INDEX "delivery_settlements_settled_at_idx" ON "delivery_settlements"("settled_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_settlement_settings_tenant_id_key" ON "delivery_settlement_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "public_tracking_tokens_token_key" ON "public_tracking_tokens"("token");

-- CreateIndex
CREATE INDEX "public_tracking_tokens_tenant_id_idx" ON "public_tracking_tokens"("tenant_id");

-- CreateIndex
CREATE INDEX "public_tracking_tokens_order_id_idx" ON "public_tracking_tokens"("order_id");

-- CreateIndex
CREATE INDEX "public_tracking_tokens_expires_at_idx" ON "public_tracking_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "delivery_settlements" ADD CONSTRAINT "delivery_settlements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_settlements" ADD CONSTRAINT "delivery_settlements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_manager_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_settlement_settings" ADD CONSTRAINT "delivery_settlement_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_tracking_tokens" ADD CONSTRAINT "public_tracking_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_tracking_tokens" ADD CONSTRAINT "public_tracking_tokens_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_manager_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
