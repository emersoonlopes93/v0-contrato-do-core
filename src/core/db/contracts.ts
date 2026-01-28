/**
 * Database Contracts - Core Interfaces
 * 
 * Contratos neutros e database-agnostic.
 * Nenhuma dependência de bibliotecas externas.
 */

export interface IQueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
  value: any;
}

export interface IQueryOptions {
  filters?: IQueryFilter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  include?: string[];
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: IQueryOptions): Promise<T[]>;
  findOne(filters: IQueryFilter[]): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filters?: IQueryFilter[]): Promise<number>;
}

export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  execute<R>(fn: (tx: ITransaction) => Promise<R>): Promise<R>;
}

export interface ITenantContext {
  tenantId: string;
  userId?: string;
}

export interface IDatabaseAdapter {
  /**
   * Define o contexto do tenant para queries automáticas
   */
  setTenantContext(context: ITenantContext | null): void;

  /**
   * Obtém um repositório genérico para uma entidade
   */
  repository<T>(entityName: string): IRepository<T>;

  /**
   * Executa uma transação
   */
  transaction<R>(fn: (tx: IDatabaseAdapter) => Promise<R>): Promise<R>;

  /**
   * Executa uma query raw SQL (use com cautela)
   */
  raw<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Fecha a conexão
   */
  disconnect(): Promise<void>;

  /**
   * Health check
   */
  ping(): Promise<boolean>;
}

export interface IDatabaseAdapterFactory {
  create(connectionString: string): Promise<IDatabaseAdapter>;
}
