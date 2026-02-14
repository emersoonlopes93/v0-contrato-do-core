type AsyncTenantStore = {
  run<T>(store: string, callback: () => T | Promise<T>): T | Promise<T>;
  getStore(): string | undefined;
};

let tenantContext: AsyncTenantStore | null = null;
let tenantContextInit: Promise<void> | null = null;

function createFallbackStore(): AsyncTenantStore {
  return {
    run<T>(_: string, callback: () => T | Promise<T>): T | Promise<T> {
      return callback();
    },
    getStore(): string | undefined {
      return undefined;
    },
  };
}

async function ensureTenantContext(): Promise<AsyncTenantStore> {
  if (typeof window !== 'undefined') {
    return createFallbackStore();
  }
  if (tenantContext) return tenantContext;
  if (!tenantContextInit) {
    tenantContextInit = import('async_hooks').then(({ AsyncLocalStorage }) => {
      tenantContext = new AsyncLocalStorage<string>();
    });
  }
  await tenantContextInit;
  return tenantContext ?? createFallbackStore();
}

export async function runWithTenant<T>(
  tenantId: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  const context = await ensureTenantContext();
  const result = context.run(tenantId, fn);
  return await Promise.resolve(result);
}

export function getTenantId(): string | undefined {
  return tenantContext?.getStore();
}
