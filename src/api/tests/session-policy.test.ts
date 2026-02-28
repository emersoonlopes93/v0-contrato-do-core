import { describe, it, expect, vi } from 'vitest'
import { SessionPolicyService } from '@/src/api/v1/security/session-policy.service'

class MockAuthRepo {
  private tokens: Array<{ id: string; token_hash: string; created_at: Date; revoked: boolean }> = []
  listUserRefreshTokens = vi.fn(async (userId: string) => {
    if (userId.length === 0) {
      // noop to satisfy lint unused
    }
    return this.tokens
  })
  revokeRefreshTokenById = vi.fn(async (id: string) => {
    const t = this.tokens.find((x) => x.id === id)
    if (t) t.revoked = true
  })
  seed(count: number): void {
    this.tokens = Array.from({ length: count }).map((_, i) => ({
      id: `t${i}`,
      token_hash: `h${i}`,
      created_at: new Date(Date.now() - (count - i) * 1000),
      revoked: false,
    }))
  }
}

describe('SessionPolicyService', () => {
  it('revokes oldest sessions beyond max', async () => {
    const repo = new MockAuthRepo()
    repo.seed(5)
    const svc = new SessionPolicyService({ maxSessions: 3 }, repo)
    await svc.registerSession('user-1', 'refresh-token-new', 'dev', '127.0.0.1', 'UA')
    expect(repo.revokeRefreshTokenById).toHaveBeenCalledTimes(2)
    expect(repo.listUserRefreshTokens).toHaveBeenCalled()
  })
})
