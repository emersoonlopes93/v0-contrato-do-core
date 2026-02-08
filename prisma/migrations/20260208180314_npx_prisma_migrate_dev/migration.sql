-- AlterTable
ALTER TABLE "tenant_settings" ADD COLUMN     "kds_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pdv_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "printing_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "realtime_enabled" BOOLEAN NOT NULL DEFAULT true;
