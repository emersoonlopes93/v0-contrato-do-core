-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "address" JSONB NOT NULL,
    "opening_hours" JSONB NOT NULL,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "dine_in_enabled" BOOLEAN NOT NULL DEFAULT false,
    "minimum_order" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_prep_time_min" INTEGER NOT NULL DEFAULT 0,
    "payment_methods" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sound_notification_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sound_key" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sound_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_tenant_id_key" ON "store_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "store_settings_tenant_id_idx" ON "store_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "store_settings_slug_idx" ON "store_settings"("slug");

-- CreateIndex
CREATE INDEX "sound_notification_settings_tenant_id_idx" ON "sound_notification_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "sound_notification_settings_user_role_idx" ON "sound_notification_settings"("user_role");

-- CreateIndex
CREATE INDEX "sound_notification_settings_event_idx" ON "sound_notification_settings"("event");

-- CreateIndex
CREATE UNIQUE INDEX "sound_notification_settings_tenant_id_user_role_event_key" ON "sound_notification_settings"("tenant_id", "user_role", "event");

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sound_notification_settings" ADD CONSTRAINT "sound_notification_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
