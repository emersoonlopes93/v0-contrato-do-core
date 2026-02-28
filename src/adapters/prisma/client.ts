/**
 * Prisma Client Singleton
 * 
 * Gerencia uma única instância do PrismaClient.
 */

import { PrismaClient } from '@prisma/client';
import { withTenantProxy } from './prisma-tenant-proxy';
import { getTenantId } from '@/src/core/context/async-context';
import { TENANT_TABLES } from './tenant-middleware';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof withTenantProxy> | undefined;
};

function createPrismaClient(): ReturnType<typeof withTenantProxy> {
  const baseClient = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
  type PrismaMiddleware = (params: { model?: string; action: string; args: any }, next: (params: any) => Promise<any>) => Promise<any>;
  const middleware: PrismaMiddleware = async (params, next) => {
    const tenantId = getTenantId();
    if (!tenantId || !params.model || !TENANT_TABLES.includes(params.model)) {
      return next(params);
    }
    if (params.action === 'findUnique') {
      params.action = 'findFirst';
      params.args = {
        ...params.args,
        where: { ...(params.args?.where ?? {}), tenant_id: tenantId },
      };
    } else if (params.action === 'findFirst' || params.action === 'findMany' || params.action === 'count') {
      params.args = {
        ...params.args,
        where: { ...(params.args?.where ?? {}), tenant_id: tenantId },
      };
    } else if (params.action === 'update' || params.action === 'delete' || params.action === 'updateMany' || params.action === 'deleteMany') {
      params.args = {
        ...params.args,
        where: { ...(params.args?.where ?? {}), tenant_id: tenantId },
      };
    } else if (params.action === 'create') {
      const data = params.args?.data ?? {};
      params.args = { ...params.args, data: { ...data, tenant_id: tenantId } };
    } else if (params.action === 'createMany') {
      const data = params.args?.data;
      if (Array.isArray(data)) {
        params.args = { ...params.args, data: data.map((d) => ({ ...d, tenant_id: tenantId })) };
      } else if (data && typeof data === 'object') {
        params.args = { ...params.args, data: { ...data, tenant_id: tenantId } };
      }
    } else if (params.action === 'upsert') {
      const where = params.args?.where ?? {};
      const create = params.args?.create ?? {};
      params.args = { ...params.args, where: { ...where, tenant_id: tenantId }, create: { ...create, tenant_id: tenantId } };
    }
    return next(params);
  };
  (baseClient as unknown as { $use: (mw: PrismaMiddleware) => void }).$use(middleware);
  return withTenantProxy(baseClient);
}

function createBrowserStub(): ReturnType<typeof withTenantProxy> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get() {
      throw new Error('PrismaClient não disponível no browser');
    },
  };
  return new Proxy<Record<string, unknown>>({}, handler) as ReturnType<typeof withTenantProxy>;
}

function resolvePrismaClient(): ReturnType<typeof withTenantProxy> {
  if (typeof window !== 'undefined') {
    return createBrowserStub();
  }
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const created = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = created;
  }
  return created;
}

export const prisma = resolvePrismaClient();

export function getPrismaClient() {
  return prisma;
}

if (typeof window === 'undefined') {
  let disconnecting = false;
  const disconnect = async (): Promise<void> => {
    if (disconnecting) return;
    disconnecting = true;
    try {
      await prisma.$disconnect();
    } catch {
      void 0;
    }
  };

  process.once('SIGINT', () => {
    void disconnect().finally(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void disconnect().finally(() => process.exit(0));
  });
}
