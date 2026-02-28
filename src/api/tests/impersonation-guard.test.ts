import { describe, it, expect, vi } from 'vitest'
import { denyImpersonationForAction } from '@/src/api/v1/security/impersonation.guard'
import type { Request, Response, NextFunction } from '@/src/api/v1/middleware'

describe('Impersonation Guard', () => {
  it('denies restricted action when impersonation token present', async () => {
    const req = {
      headers: { 'x-impersonation-token': 'tok123' },
      method: 'PATCH',
      url: '/api/v1/admin/tenants/:tenantId/plan',
    } as unknown as Request
    const res = { status: 0, body: {} } as Response
    const next: NextFunction = vi.fn()
    const mw = denyImpersonationForAction('admin.plans.assign')
    const mockGet = vi.spyOn(await import('@/src/infrastructure/redis/redis-client'), 'redisClient').mockResolvedValue({
      get: vi.fn(async (key: string) => (key === 'imp:tok123' ? '{}' : null)),
      set: vi.fn(async () => {}),
      setex: vi.fn(async () => {}),
      del: vi.fn(async () => {}),
      incr: vi.fn(async () => 1),
      expire: vi.fn(async () => {}),
      exists: vi.fn(async () => false),
    })
    await mw(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toBe(403)
    mockGet.mockRestore()
  })
})
