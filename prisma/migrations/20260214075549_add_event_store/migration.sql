-- CreateTable
CREATE TABLE "event_store" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "event_name" TEXT NOT NULL,
    "aggregate_type" TEXT,
    "aggregate_id" TEXT,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retries" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_consumers" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "consumer_name" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_consumers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "driver_id" TEXT,
    "order_ids" JSONB NOT NULL,
    "stops" JSONB NOT NULL,
    "total_distance_km" DOUBLE PRECISION,
    "total_eta_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_drivers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "active_order_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "last_location_at" TIMESTAMP(3),
    "last_delivery_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_positions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_status_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_store_tenant_id_status_occurred_at_idx" ON "event_store"("tenant_id", "status", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_consumers_event_id_consumer_name_key" ON "event_consumers"("event_id", "consumer_name");

-- CreateIndex
CREATE INDEX "delivery_routes_tenant_id_idx" ON "delivery_routes"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_routes_driver_id_idx" ON "delivery_routes"("driver_id");

-- CreateIndex
CREATE INDEX "delivery_drivers_tenant_id_idx" ON "delivery_drivers"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_drivers_active_order_id_idx" ON "delivery_drivers"("active_order_id");

-- CreateIndex
CREATE INDEX "driver_positions_tenant_id_idx" ON "driver_positions"("tenant_id");

-- CreateIndex
CREATE INDEX "driver_positions_driver_id_idx" ON "driver_positions"("driver_id");

-- CreateIndex
CREATE INDEX "driver_positions_recorded_at_idx" ON "driver_positions"("recorded_at");

-- CreateIndex
CREATE INDEX "driver_status_history_tenant_id_idx" ON "driver_status_history"("tenant_id");

-- CreateIndex
CREATE INDEX "driver_status_history_driver_id_idx" ON "driver_status_history"("driver_id");

-- CreateIndex
CREATE INDEX "driver_status_history_order_id_idx" ON "driver_status_history"("order_id");

-- CreateIndex
CREATE INDEX "driver_status_history_timestamp_idx" ON "driver_status_history"("timestamp");

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_drivers" ADD CONSTRAINT "delivery_drivers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_positions" ADD CONSTRAINT "driver_positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_positions" ADD CONSTRAINT "driver_positions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_status_history" ADD CONSTRAINT "driver_status_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_status_history" ADD CONSTRAINT "driver_status_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "delivery_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
