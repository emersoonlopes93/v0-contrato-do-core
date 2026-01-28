/**
 * Prisma Database Adapter
 * 
 * Implementação concreta do IDatabaseAdapter usando Prisma.
 */

import { PrismaClient } from '@prisma/client';
import type {
  IDatabaseAdapter,
  IDatabaseAdapterFactory,
  IRepository,
  ITransaction,
  ITenantContext,
  IQueryFilter,
  IQueryOptions,
} from '../../core/db/contracts';
import { createTenantMiddleware } from './tenant-middleware';

export class PrismaAdapter implements IDatabaseAdapter {
  private client: PrismaClient;
  private tenantContext: ITenantContext | null = null;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  setTenantContext(context: ITenantContext | null): void {
    this.tenantContext = context;
    
    // Aplica middleware de tenant
    if (context) {
      this.client.$use(createTenantMiddleware(context));
    }
  }

  repository<T>(entityName: string): IRepository<T> {
    return new PrismaRepository<T>(this.client, entityName, this.tenantContext);
  }

  async transaction<R>(fn: (tx: IDatabaseAdapter) => Promise<R>): Promise<R> {
    return await this.client.$transaction(async (prisma) => {
      const txAdapter = new PrismaAdapter(prisma as PrismaClient);
      txAdapter.setTenantContext(this.tenantContext);
      return await fn(txAdapter);
    });
  }

  async raw<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return await this.client.$queryRawUnsafe<T[]>(sql, ...(params || []));
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

class PrismaRepository<T> implements IRepository<T> {
  constructor(
    private client: PrismaClient,
    private entityName: string,
    private tenantContext: ITenantContext | null
  ) {}

  private getModel(): any {
    const modelName =
      this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
    return (this.client as any)[modelName];
  }

  private buildWhereClause(filters?: IQueryFilter[]): any {
    if (!filters || filters.length === 0) return {};

    const where: any = {};

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value;
          break;
        case 'neq':
          where[filter.field] = { not: filter.value };
          break;
        case 'gt':
          where[filter.field] = { gt: filter.value };
          break;
        case 'gte':
          where[filter.field] = { gte: filter.value };
          break;
        case 'lt':
          where[filter.field] = { lt: filter.value };
          break;
        case 'lte':
          where[filter.field] = { lte: filter.value };
          break;
        case 'in':
          where[filter.field] = { in: filter.value };
          break;
        case 'like':
          where[filter.field] = { contains: filter.value, mode: 'insensitive' };
          break;
      }
    }

    return where;
  }

  async findById(id: string): Promise<T | null> {
    const model = this.getModel();
    return await model.findUnique({
      where: { id },
    });
  }

  async findMany(options?: IQueryOptions): Promise<T[]> {
    const model = this.getModel();
    const where = this.buildWhereClause(options?.filters);

    const orderBy = options?.orderBy?.map((o) => ({
      [o.field]: o.direction,
    }));

    return await model.findMany({
      where,
      orderBy,
      skip: options?.offset,
      take: options?.limit,
      include: options?.include?.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as any),
    });
  }

  async findOne(filters: IQueryFilter[]): Promise<T | null> {
    const model = this.getModel();
    const where = this.buildWhereClause(filters);

    return await model.findFirst({
      where,
    });
  }

  async create(data: Partial<T>): Promise<T> {
    const model = this.getModel();
    return await model.create({
      data,
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const model = this.getModel();
    return await model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const model = this.getModel();
    await model.delete({
      where: { id },
    });
  }

  async count(filters?: IQueryFilter[]): Promise<number> {
    const model = this.getModel();
    const where = this.buildWhereClause(filters);

    return await model.count({
      where,
    });
  }
}

export class PrismaAdapterFactory implements IDatabaseAdapterFactory {
  async create(connectionString: string): Promise<IDatabaseAdapter> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // Test connection
    try {
      await client.$connect();
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error}`);
    }

    return new PrismaAdapter(client);
  }
}
