/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,provider,external_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,user_id,role_id]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_provider_external_id_key";

-- DropIndex
DROP INDEX "user_roles_user_id_role_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenant_id_provider_external_id_key" ON "payments"("tenant_id", "provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_tenant_id_user_id_role_id_key" ON "user_roles"("tenant_id", "user_id", "role_id");
