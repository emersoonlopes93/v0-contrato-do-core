import type { IDatabaseAdapter } from '../../../../core/db/contracts';

export interface HelloRecord {
  tenantId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

/**
 * Hello Repository
 * 
 * IMPORTANTE: tenant_id é OBRIGATÓRIO em todas as queries
 */
export class HelloRepository {
  constructor(private database: IDatabaseAdapter) {}

  async saveHello(data: HelloRecord): Promise<void> {
    // Simula persistência (em produção usaria Prisma)
    console.log('[HelloModule] Saved hello:', {
      tenant_id: data.tenantId,
      user_id: data.userId,
      message: data.message,
      created_at: data.createdAt,
    });

    // Em produção:
    // await this.database.query('hellos').create({
    //   tenant_id: data.tenantId,
    //   user_id: data.userId,
    //   message: data.message,
    //   created_at: data.createdAt,
    // });
  }

  async findByTenant(tenantId: string): Promise<HelloRecord[]> {
    // tenant_id OBRIGATÓRIO
    console.log('[HelloModule] Finding hellos for tenant:', tenantId);

    // Em produção:
    // return this.database.query('hellos').findMany({
    //   where: { tenant_id: tenantId },
    //   orderBy: { created_at: 'desc' },
    // });

    return [];
  }
}
