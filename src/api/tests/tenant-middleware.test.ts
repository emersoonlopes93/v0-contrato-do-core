import { describe, it, expect, vi } from 'vitest';
import { createTenantMiddleware, TENANT_TABLES } from '@/src/adapters/prisma/tenant-middleware';

function makeParams(model: string, action: string, where?: Record<string, unknown>) {
  return {
    model,
    action,
    args: { where: where ?? {} },
  };
}

describe('Tenant Middleware', () => {
  it('transforms findUnique to findFirst and injects tenant_id', async () => {
    const context = { tenantId: 'tenant-x' };
    const mw = createTenantMiddleware(context);
    const next = vi.fn(async (p) => p);
    const model = TENANT_TABLES[0]!;
    const params = { model, action: 'findUnique', args: { where: { id: 'abc' } } };
    const result = await mw(params as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>);
    const r = result as { action: string; args: { where: Record<string, unknown> } };
    expect(r.action).toBe('findFirst');
    expect(r.args.where).toEqual({ id: 'abc', tenant_id: 'tenant-x' });
  });
  it('injects tenant_id for tenant-scoped models on findMany', async () => {
    const context = { tenantId: 'tenant-x' };
    const mw = createTenantMiddleware(context);
    const next = vi.fn(async (p) => p);
    const model = TENANT_TABLES[0]!;
    const params = makeParams(model, 'findMany', {});
    const result = await mw(params as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>);
    const r = result as { args: { where: Record<string, unknown> } };
    expect(r.args.where).toEqual({ tenant_id: 'tenant-x' });
  });

  it('does not change non-tenant tables', async () => {
    const context = { tenantId: 'tenant-x' };
    const mw = createTenantMiddleware(context);
    const next = vi.fn(async (p) => p);
    const params = makeParams('Tenant', 'findMany', {});
    const result = await mw(params as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>);
    const r = result as { args: { where: Record<string, unknown> } };
    expect(r.args.where).toEqual({});
  });

  it('skips when no context', async () => {
    const mw = createTenantMiddleware(null);
    const next = vi.fn(async (p) => p);
    const params = makeParams(TENANT_TABLES[0]!, 'findMany', {});
    const result = await mw(params as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>);
    const r = result as { args: { where: Record<string, unknown> } };
    expect(r.args.where).toEqual({});
  });
});
