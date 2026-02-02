/**
 * Prisma Client Singleton
 * 
 * Gerencia uma única instância do PrismaClient.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

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
