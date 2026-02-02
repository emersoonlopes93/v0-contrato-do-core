import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import { hash } from 'bcryptjs';
import menuOnlineModule from '@/src/modules/menu-online/src';
import soundNotificationsModule from '@/src/modules/sound-notifications/src';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Seed (Development)...');

  // 1️⃣ SaaS ADMIN (OPCIONAL, MAS RECOMENDADO)
  console.log('Creating/Updating SaaS Admin...');
  const saasAdminPassword = await hash('admin123', 10);
  const saasAdmin = await prisma.saaSAdminUser.upsert({
    where: { email: 'admin@saas.local' },
    update: {},
    create: {
      email: 'admin@saas.local',
      password_hash: saasAdminPassword,
      name: 'SaaS Admin',
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`✅ SaaS Admin: ${saasAdmin.email}`);

  // 2️⃣ PLANO DO TENANT (Pro)
  console.log('Creating/Updating Plans...');
  const planPro = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      description: 'For growing businesses',
      price: 49.99,
      limits: {
        users: 10,
        storage_mb: 1000,
        api_calls_daily: 10000,
      },
      status: 'active',
    },
  });
  console.log(`✅ Plan: ${planPro.name} (${planPro.slug})`);

  // 3️⃣ MÓDULO HELLO
  console.log('Creating/Updating Modules...');
  const helloModule = await prisma.module.upsert({
    where: { slug: 'hello-module' },
    update: {},
    create: {
      id: 'hello-module', // FORCE ID to match slug for easier referencing
      name: 'Hello Module',
      slug: 'hello-module',
      version: '1.0.0',
      description: 'A sample module to demonstrate modular architecture',
      permissions: ['hello.read', 'hello.create'],
      events: ['hello.created'],
      required_plan: 'pro', // Exige plano Pro
      status: 'active',
    },
  });
  console.log(`✅ Module: ${helloModule.name} (${helloModule.slug})`);

  // 3.1️⃣ PERMISSÕES DO MÓDULO
  console.log('Creating/Updating Permissions...');
  const permissions = [
    { slug: 'hello.read', name: 'Read Hello', description: 'Can read hello messages' },
    { slug: 'hello.create', name: 'Create Hello', description: 'Can create hello messages' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        module_id_slug: {
          module_id: helloModule.id,
          slug: perm.slug,
        },
      },
      update: {},
      create: {
        module_id: helloModule.id,
        slug: perm.slug,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log(`✅ Permissions created for: ${helloModule.slug}`);

  const ordersModule = await prisma.module.upsert({
    where: { slug: 'orders-module' },
    update: {},
    create: {
      id: 'orders-module',
      name: 'Orders Module',
      slug: 'orders-module',
      version: '1.0.0',
      description: 'Orders management module',
      permissions: ['orders.read', 'orders.create'],
      events: ['orders.created'],
      required_plan: 'pro',
      status: 'active',
    },
  });
  console.log(`✅ Module: ${ordersModule.name} (${ordersModule.slug})`);

  const ordersPermissions = [
    { slug: 'orders.read', name: 'Read Orders', description: 'Can read orders' },
    { slug: 'orders.create', name: 'Create Orders', description: 'Can create orders' },
  ];

  for (const perm of ordersPermissions) {
    await prisma.permission.upsert({
      where: {
        module_id_slug: {
          module_id: ordersModule.id,
          slug: perm.slug,
        },
      },
      update: {},
      create: {
        module_id: ordersModule.id,
        slug: perm.slug,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log(`✅ Permissions created for: ${ordersModule.slug}`);

  const menuOnlineDbModule = await prisma.module.upsert({
    where: { slug: 'menu-online' },
    update: {
      name: menuOnlineModule.manifest.name,
      slug: 'menu-online',
      version: menuOnlineModule.manifest.version,
      description: menuOnlineModule.manifest.description ?? '',
      permissions: menuOnlineModule.manifest.permissions.map((p) => p.id),
      events: menuOnlineModule.manifest.eventTypes.map((e) => e.id),
      required_plan: menuOnlineModule.manifest.requiredPlan ?? null,
      status: 'active',
    },
    create: {
      id: 'menu-online',
      name: menuOnlineModule.manifest.name,
      slug: 'menu-online',
      version: menuOnlineModule.manifest.version,
      description: menuOnlineModule.manifest.description ?? '',
      permissions: menuOnlineModule.manifest.permissions.map((p) => p.id),
      events: menuOnlineModule.manifest.eventTypes.map((e) => e.id),
      required_plan: menuOnlineModule.manifest.requiredPlan ?? null,
      status: 'active',
    },
  });
  console.log(`✅ Module: ${menuOnlineDbModule.name} (${menuOnlineDbModule.slug})`);

  for (const perm of menuOnlineModule.manifest.permissions) {
    await prisma.permission.upsert({
      where: {
        module_id_slug: {
          module_id: menuOnlineDbModule.id,
          slug: perm.id,
        },
      },
      update: {
        name: perm.name,
        description: perm.description,
      },
      create: {
        module_id: menuOnlineDbModule.id,
        slug: perm.id,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log(`✅ Permissions created for: ${menuOnlineDbModule.slug}`);

  const soundNotificationsDbModule = await prisma.module.upsert({
    where: { slug: 'sound-notifications' },
    update: {
      name: soundNotificationsModule.manifest.name,
      slug: 'sound-notifications',
      version: soundNotificationsModule.manifest.version,
      description: soundNotificationsModule.manifest.description ?? '',
      permissions: soundNotificationsModule.manifest.permissions.map((p) => p.id),
      events: soundNotificationsModule.manifest.eventTypes.map((e) => e.id),
      required_plan: soundNotificationsModule.manifest.requiredPlan ?? null,
      status: 'active',
    },
    create: {
      id: 'sound-notifications',
      name: soundNotificationsModule.manifest.name,
      slug: 'sound-notifications',
      version: soundNotificationsModule.manifest.version,
      description: soundNotificationsModule.manifest.description ?? '',
      permissions: soundNotificationsModule.manifest.permissions.map((p) => p.id),
      events: soundNotificationsModule.manifest.eventTypes.map((e) => e.id),
      required_plan: soundNotificationsModule.manifest.requiredPlan ?? null,
      status: 'active',
    },
  });
  console.log(`✅ Module: ${soundNotificationsDbModule.name} (${soundNotificationsDbModule.slug})`);

  for (const perm of soundNotificationsModule.manifest.permissions) {
    await prisma.permission.upsert({
      where: {
        module_id_slug: {
          module_id: soundNotificationsDbModule.id,
          slug: perm.id,
        },
      },
      update: {
        name: perm.name,
        description: perm.description,
      },
      create: {
        module_id: soundNotificationsDbModule.id,
        slug: perm.id,
        name: perm.name,
        description: perm.description,
      },
    });
  }
  console.log(`✅ Permissions created for: ${soundNotificationsDbModule.slug}`);

  // 4️⃣ TENANT DEMO
  console.log('Creating/Updating Demo Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {
      status: 'active',
      onboarded: true,
      onboarded_at: new Date(),
    },
    create: {
      name: 'Demo Tenant',
      slug: 'demo',
      status: 'active',
      onboarded: true,
      onboarded_at: new Date(),
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.slug})`);

  // 5️⃣ SUBSCRIPTION (PLANO PRO)
  console.log('Creating/Updating Tenant Subscription...');
  // Check if active subscription exists
  const existingSub = await prisma.tenantSubscription.findFirst({
    where: {
      tenant_id: tenant.id,
      status: 'active',
    },
  });

  if (!existingSub) {
    await prisma.tenantSubscription.create({
      data: {
        tenant_id: tenant.id,
        plan_id: planPro.id,
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 ano
      },
    });
    console.log(`✅ Subscription created for plan: ${planPro.slug}`);
  } else {
    console.log(`ℹ️ Active subscription already exists.`);
  }

  // 6️⃣ ATIVAR MÓDULOS (HELLO MODULE)
  console.log('Activating Modules for Tenant...');
  await prisma.tenantModule.upsert({
    where: {
      tenant_id_module_id: {
        tenant_id: tenant.id,
        module_id: helloModule.id,
      },
    },
    update: { status: 'active' },
    create: {
      tenant_id: tenant.id,
      module_id: helloModule.id,
      status: 'active',
      activated_at: new Date(),
    },
  });
  console.log(`✅ Module activated: ${helloModule.slug}`);

  await prisma.tenantModule.upsert({
    where: {
      tenant_id_module_id: {
        tenant_id: tenant.id,
        module_id: soundNotificationsDbModule.id,
      },
    },
    update: { status: 'active' },
    create: {
      tenant_id: tenant.id,
      module_id: soundNotificationsDbModule.id,
      status: 'active',
      activated_at: new Date(),
    },
  });
  console.log(`✅ Module activated: ${soundNotificationsDbModule.slug}`);

  // 7️⃣ TENANT USER (ADMIN)
  console.log('Creating/Updating Tenant User...');
  const tenantUserPassword = await hash('demo123', 10);
  
  // Create user first
  const tenantUser = await prisma.tenantUser.upsert({
    where: {
      tenant_id_email: {
        tenant_id: tenant.id,
        email: 'demo@tenant.local',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'demo@tenant.local',
      password_hash: tenantUserPassword,
      name: 'Demo User',
      status: 'active',
    },
  });
  console.log(`✅ Tenant User: ${tenantUser.email}`);

  // 8️⃣ ROLES E PERMISSÕES (BÁSICO)
  console.log('Setting up Roles...');
  const adminRole = await prisma.role.upsert({
    where: {
      tenant_id_slug: {
        tenant_id: tenant.id,
        slug: 'admin',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Administrator',
      slug: 'admin',
      description: 'Full access to tenant resources',
    },
  });

  // Assign role to user
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: tenantUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: tenantUser.id,
      tenant_id: tenant.id,
      role_id: adminRole.id,
    },
  });
  console.log(`✅ Role assigned: ${adminRole.slug} to ${tenantUser.email}`);

  const rolePerms = await prisma.permission.findMany({
    where: {
      module_id: {
        in: [helloModule.id, ordersModule.id, menuOnlineDbModule.id, soundNotificationsDbModule.id],
      },
    },
    select: {
      id: true,
    },
  });
  await prisma.rolePermission.createMany({
    data: rolePerms.map((p) => ({
      role_id: adminRole.id,
      permission_id: p.id,
    })),
    skipDuplicates: true,
  });

  console.log('\n=============================================');
  console.log('✅ Seed completed successfully');
  console.log(`Tenant: ${tenant.slug}`);
  console.log(`Tenant User: demo@tenant.local / demo123`);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
