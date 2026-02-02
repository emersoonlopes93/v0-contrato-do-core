import { getPrismaClient } from '@/src/adapters/prisma/client';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export class TenantModulePermissionService {
  private prisma = getPrismaClient();

  async grantModulePermissionsToAdminRole(tenantId: string, moduleIdOrSlug: string): Promise<void> {
    const adminRole = await this.prisma.role.findUnique({
      where: {
        tenant_id_slug: {
          tenant_id: tenantId,
          slug: 'admin',
        },
      },
      select: { id: true },
    });

    if (!adminRole) {
      throw new Error('Admin role not found for tenant');
    }

    const moduleRecord = await this.prisma.module.findFirst({
      where: {
        OR: [{ id: moduleIdOrSlug }, { slug: moduleIdOrSlug }],
      },
      select: { id: true, permissions: true },
    });

    if (!moduleRecord) {
      throw new Error('Module not found');
    }

    let permissions = await this.prisma.permission.findMany({
      where: { module_id: moduleRecord.id },
      select: { id: true },
    });

    if (permissions.length === 0) {
      const slugs = isStringArray(moduleRecord.permissions) ? moduleRecord.permissions : [];

      if (slugs.length > 0) {
        await this.prisma.permission.createMany({
          data: slugs.map((slug) => ({
            module_id: moduleRecord.id,
            slug,
            name: slug,
            description: slug,
          })),
          skipDuplicates: true,
        });

        permissions = await this.prisma.permission.findMany({
          where: { module_id: moduleRecord.id },
          select: { id: true },
        });
      }
    }

    if (permissions.length === 0) {
      return;
    }

    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        role_id: adminRole.id,
        permission_id: p.id,
      })),
      skipDuplicates: true,
    });
  }
}
