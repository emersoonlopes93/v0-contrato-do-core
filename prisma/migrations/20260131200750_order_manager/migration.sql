-- CreateTable
CREATE TABLE "order_manager_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "delivery_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_manager_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_manager_order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_manager_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_manager_order_item_modifiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_manager_order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_manager_order_timeline_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "user_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_manager_order_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_manager_orders_tenant_id_idx" ON "order_manager_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "order_manager_orders_status_idx" ON "order_manager_orders"("status");

-- CreateIndex
CREATE INDEX "order_manager_orders_created_at_idx" ON "order_manager_orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_manager_orders_tenant_id_order_number_key" ON "order_manager_orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_manager_order_items_tenant_id_idx" ON "order_manager_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_manager_order_items_order_id_idx" ON "order_manager_order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_manager_order_item_modifiers_tenant_id_idx" ON "order_manager_order_item_modifiers"("tenant_id");

-- CreateIndex
CREATE INDEX "order_manager_order_item_modifiers_order_item_id_idx" ON "order_manager_order_item_modifiers"("order_item_id");

-- CreateIndex
CREATE INDEX "order_manager_order_timeline_events_tenant_id_idx" ON "order_manager_order_timeline_events"("tenant_id");

-- CreateIndex
CREATE INDEX "order_manager_order_timeline_events_order_id_idx" ON "order_manager_order_timeline_events"("order_id");

-- CreateIndex
CREATE INDEX "order_manager_order_timeline_events_timestamp_idx" ON "order_manager_order_timeline_events"("timestamp");

-- AddForeignKey
ALTER TABLE "order_manager_orders" ADD CONSTRAINT "order_manager_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_items" ADD CONSTRAINT "order_manager_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_items" ADD CONSTRAINT "order_manager_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_manager_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_item_modifiers" ADD CONSTRAINT "order_manager_order_item_modifiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_item_modifiers" ADD CONSTRAINT "order_manager_order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_manager_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_timeline_events" ADD CONSTRAINT "order_manager_order_timeline_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_timeline_events" ADD CONSTRAINT "order_manager_order_timeline_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_manager_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_manager_order_timeline_events" ADD CONSTRAINT "order_manager_order_timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
