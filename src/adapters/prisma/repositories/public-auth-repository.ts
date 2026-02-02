import { getPrismaClient } from '@/src/adapters/prisma/client';

export interface CreateTenantWithOwnerInput {
  tenantName: string;
  tenantSlug: string;
  email: string;
  passwordHash: string;
}

export interface CreateTenantWithOwnerResult {
  tenantId: string;
  tenantSlug: string;
  userId: string;
}

export class PublicAuthRepository {
  private readonly prisma = getPrismaClient();

  async isTenantSlugTaken(slug: string): Promise<boolean> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return existing !== null;
  }

  async createTenantWithOwner(
    input: CreateTenantWithOwnerInput,
  ): Promise<CreateTenantWithOwnerResult> {
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.tenantSlug,
          status: 'active',
          onboarded: true,
          onboarded_at: new Date(),
        },
      });

      const user = await tx.tenantUser.create({
        data: {
          tenant_id: tenant.id,
          email: input.email,
          password_hash: input.passwordHash,
          name: input.tenantName,
          status: 'active',
        },
      });

      const role = await tx.role.create({
        data: {
          tenant_id: tenant.id,
          name: 'Owner',
          slug: 'owner',
          description: 'Tenant owner',
        },
      });

      await tx.userRole.create({
        data: {
          user_id: user.id,
          tenant_id: tenant.id,
          role_id: role.id,
        },
      });

      await tx.tenantSettings.create({
        data: {
          tenant_id: tenant.id,
          trade_name: input.tenantName,
        },
      });

      const output: CreateTenantWithOwnerResult = {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userId: user.id,
      };

      return output;
    });

    return result;
  }
}

