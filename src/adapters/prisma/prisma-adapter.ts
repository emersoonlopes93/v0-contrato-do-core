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
  ITenantContext,
  IQueryFilter,
  IQueryOptions,
  QueryValue,
  RawQueryParam,
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
      (this.client as unknown as { $use(middleware: unknown): void }).$use(
        createTenantMiddleware(context)
      );
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

  async raw<T = Record<string, never>>(
    sql: string,
    params?: RawQueryParam[],
  ): Promise<T[]> {
    return await this.client.$queryRawUnsafe<T[]>(sql, ...(params ?? []));
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

type PrismaWhere = Record<string, QueryValue>;

class PrismaRepository<T> implements IRepository<T> {
  constructor(
    private client: PrismaClient,
    private entityName: string,
    private tenantContext: ITenantContext | null
  ) {}

  private getModel() {
    const modelName =
      this.entityName.charAt(0).toLowerCase() + this.entityName.slice(1);
    const client = this.client as unknown as Record<string, unknown>;
    const model = client[modelName];

    if (!model || typeof model !== 'object') {
      throw new Error(`Prisma model not found for entity: ${this.entityName}`);
    }

    return model as {
      findUnique(args: { where: PrismaWhere }): Promise<T | null>;
      findMany(args: {
        where?: PrismaWhere;
        orderBy?: Array<Record<string, 'asc' | 'desc'>>;
        skip?: number;
        take?: number;
        include?: Record<string, boolean>;
      }): Promise<T[]>;
      findFirst(args: { where: PrismaWhere }): Promise<T | null>;
      create(args: { data: Partial<T> }): Promise<T>;
      update(args: { where: { id: string }; data: Partial<T> }): Promise<T>;
      delete(args: { where: { id: string } }): Promise<void>;
      count(args: { where?: PrismaWhere }): Promise<number>;
    };
  }

  private buildWhereClause(filters?: IQueryFilter[]): PrismaWhere {
    if (!filters || filters.length === 0) return {};

    const where: PrismaWhere = {};

    for (const filter of filters) {
      switch (filter.operator) {
        case 'eq':
          where[filter.field] = filter.value;
          break;
        case 'neq':
          where[filter.field] = { not: filter.value } as unknown as QueryValue;
          break;
        case 'gt':
          where[filter.field] = { gt: filter.value } as unknown as QueryValue;
          break;
        case 'gte':
          where[filter.field] = { gte: filter.value } as unknown as QueryValue;
          break;
        case 'lt':
          where[filter.field] = { lt: filter.value } as unknown as QueryValue;
          break;
        case 'lte':
          where[filter.field] = { lte: filter.value } as unknown as QueryValue;
          break;
        case 'in':
          where[filter.field] = { in: filter.value } as unknown as QueryValue;
          break;
        case 'like':
          where[filter.field] = {
            contains: filter.value,
            mode: 'insensitive',
          } as unknown as QueryValue;
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
      }, {} as Record<string, boolean>),
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
