import { getPrismaClient } from '../../adapters/prisma/client';
import { hash } from 'bcryptjs';

interface OnboardTenantInput {
  tenantId: string;
  adminEmail: string;
  adminPassword?: string;
  name?: string;
  modules?: string[]; // Módulos a ativar (se vazio, usa todos do plano)
}

export class OnboardingService {
  private prisma = getPrismaClient();

  /**
   * Onboard a tenant
   * - Create admin user
   * - Activate modules
   * - Mark as onboarded
   */
  async onboardTenant(input: OnboardTenantInput) {
    const { tenantId, adminEmail, adminPassword, name, modules } = input;

    // 1. Validate Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: { include: { plan: true } } },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.onboarded) {
      throw new Error('Tenant already onboarded');
    }

    // 2. Determine Modules to Activate
    let modulesToActivate: string[] = [];

    if (modules && modules.length > 0) {
      modulesToActivate = modules;
    } else {
      // Get from Plan
      const activeSub = tenant.subscriptions.find((s) => s.status === 'active');
      if (activeSub && activeSub.plan) {
        // Plan limits/modules logic would go here.
        // Assuming plan has list of modules or we activate all global modules allowed for plan
        // For now, let's assume we activate modules passed or all available if plan allows.
        // Simplified: activate 'hello-module' as default or fetch all modules
        // In real world: Plan -> Features -> Modules
        // Let's query all modules for now if none specified
        const allModules = await this.prisma.module.findMany({ where: { status: 'active' } });
        modulesToActivate = allModules.map(m => m.id);
      }
    }

    // 3. Execute Transaction
    return await this.prisma.$transaction(async (tx) => {
      // A. Create/Update Admin User
      let user = await tx.tenantUser.findUnique({
        where: {
          tenant_id_email: {
            tenant_id: tenantId,
            email: adminEmail,
          },
        },
      });

      if (!user) {
        if (!adminPassword) {
          throw new Error('Password required for new user');
        }
        const passwordHash = await hash(adminPassword, 10);
        user = await tx.tenantUser.create({
          data: {
            tenant_id: tenantId,
            email: adminEmail,
            name: name || 'Admin',
            password_hash: passwordHash,
            status: 'active',
          },
        });
      }

      // B. Create Admin Role
      const adminRole = await tx.role.create({
        data: {
          tenant_id: tenantId,
          name: 'Admin',
          slug: 'admin',
          description: 'Administrator with full access',
        },
      });

      // C. Activate Modules & Assign Permissions
      for (const modIdOrSlug of modulesToActivate) {
        const mod = await tx.module.findFirst({
          where: {
            OR: [{ id: modIdOrSlug }, { slug: modIdOrSlug }],
          },
          include: {
            modulePermissions: true,
          },
        });

        if (mod) {
          // Activate Module
          await tx.tenantModule.upsert({
            where: {
              tenant_id_module_id: {
                tenant_id: tenantId,
                module_id: mod.id,
              },
            },
            update: {
              status: 'active',
              deactivated_at: null,
            },
            create: {
              tenant_id: tenantId,
              module_id: mod.id,
              status: 'active',
            },
          });

          // Assign Permissions to Admin Role
          for (const perm of mod.modulePermissions) {
            await tx.rolePermission.create({
              data: {
                role_id: adminRole.id,
                permission_id: perm.id,
              },
            });
          }
        }
      }

      // D. Assign Admin Role to User
      await tx.userRole.create({
        data: {
          user_id: user.id,
          tenant_id: tenantId,
          role_id: adminRole.id,
        },
      });

      // E. Mark Tenant as Onboarded
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          onboarded: true,
          onboarded_at: new Date(),
          status: 'active',
        },
      });

      return {
        tenant: updatedTenant,
        user,
        modulesActivated: modulesToActivate.length,
      };
    });
  }
}

export const onboardingService = new OnboardingService();
