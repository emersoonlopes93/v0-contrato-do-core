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

const baseClient = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const prisma =
  globalForPrisma.prisma ??
  withTenantProxy(baseClient);

export function getPrismaClient() {
  return prisma;
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (typeof window === 'undefined') {
  let disconnecting = false;
  const disconnect = async (): Promise<void> => {
    if (disconnecting) return;
    disconnecting = true;
    try {
      // @ts-expect-error $disconnect exists on extended client usually, but safe to call on base if needed.
      // Actually extended client forwards methods.
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
