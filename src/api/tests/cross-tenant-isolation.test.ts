import { describe, it, expect, vi } from 'vitest'
import { createTenantMiddleware, TENANT_TABLES } from '@/src/adapters/prisma/tenant-middleware'

function makeParams(model: string, action: string, where?: Record<string, unknown>) {
  return {
    model,
    action,
    args: { where: where ?? {} },
  }
}

describe('Cross-tenant isolation', () => {
  it('overrides manual tenant_id to current context', async () => {
    const context = { tenantId: 'tenant-a' }
    const mw = createTenantMiddleware(context)
    const next = vi.fn(async (p) => p)
    const model = TENANT_TABLES[0]!
    const params = makeParams(model, 'findMany', { tenant_id: 'tenant-b' })
    const result = await mw(params as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>)
    const r = result as { args: { where: Record<string, unknown> } }
    expect(r.args.where).toEqual({ tenant_id: 'tenant-a' })
  })
  it('injects tenant_id in update/delete filters', async () => {
    const context = { tenantId: 'tenant-z' }
    const mw = createTenantMiddleware(context)
    const next = vi.fn(async (p) => p)
    const model = TENANT_TABLES[0]!
    const upd = await mw(makeParams(model, 'update', { id: 'x' }) as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>)
    const del = await mw(makeParams(model, 'delete', { id: 'x' }) as unknown as { model: string; action: string; args: { where: Record<string, unknown> } }, next as unknown as (p: unknown) => Promise<unknown>)
    expect((upd as { args: { where: Record<string, unknown> } }).args.where).toEqual({ id: 'x', tenant_id: 'tenant-z' })
    expect((del as { args: { where: Record<string, unknown> } }).args.where).toEqual({ id: 'x', tenant_id: 'tenant-z' })
  })
})
