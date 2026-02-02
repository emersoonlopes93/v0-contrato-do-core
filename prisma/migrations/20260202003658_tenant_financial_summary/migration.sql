-- CreateTable
CREATE TABLE "tenant_financial_summary" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_pending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cancelled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_refunded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_financial_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_financial_summary_tenant_id_key" ON "tenant_financial_summary"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_financial_summary_tenant_id_idx" ON "tenant_financial_summary"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_financial_summary" ADD CONSTRAINT "tenant_financial_summary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
