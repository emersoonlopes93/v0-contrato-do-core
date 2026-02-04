-- AlterTable
ALTER TABLE "order_manager_order_item_modifiers" ADD COLUMN     "option_name" TEXT;

-- AlterTable
ALTER TABLE "order_manager_order_items" ADD COLUMN     "base_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "product_id" TEXT;

-- AlterTable
ALTER TABLE "order_manager_orders" ADD COLUMN     "cashback_used" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customer_snapshot" JSONB,
ADD COLUMN     "delivery_info" JSONB,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "public_order_code" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "order_manager_orders_tenant_id_public_order_code_idx" ON "order_manager_orders"("tenant_id", "public_order_code");
