/**
 * Prisma Client Singleton
 * 
 * Gerencia uma única instância do PrismaClient.
 */

import { PrismaClient } from '@prisma/client';
import { withTenantProxy } from './prisma-tenant-proxy';

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
