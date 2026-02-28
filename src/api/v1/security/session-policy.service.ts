import crypto from 'crypto'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import type { SessionMetadata, SessionPolicyConfig } from '@/src/types/session-policy'
import { AuthRepository } from '@/src/adapters/prisma/repositories/auth-repository'

type RefreshTokenRow = { id: string; token_hash: string; created_at: Date; revoked: boolean }
interface IAuthRepo {
  listUserRefreshTokens(userId: string): Promise<RefreshTokenRow[]>
  revokeRefreshTokenById(id: string): Promise<void>
}

export class SessionPolicyService {
  private maxSessions: number
  private authRepo: IAuthRepo

  constructor(config?: Partial<SessionPolicyConfig>, repo?: IAuthRepo) {
    const max = Number(process.env.SESSIONS_MAX ?? (config?.maxSessions ?? 3))
    this.maxSessions = Number.isFinite(max) && max > 0 ? max : 3
    if (repo) {
      this.authRepo = repo
    } else {
      const real = new AuthRepository()
      this.authRepo = {
        listUserRefreshTokens: async (userId: string) => real.listUserRefreshTokens(userId),
        revokeRefreshTokenById: async (id: string) => {
          await real.revokeRefreshTokenById(id)
        },
      }
    }
  }

  private sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  async registerSession(userId: string, refreshToken: string, device?: string | null, ip?: string | null, userAgent?: string | null): Promise<void> {
    const client = await redisClient()
    const tokenHash = this.sha256(refreshToken)
    const meta: SessionMetadata = {
      userId,
      tokenHash,
      device: device ?? null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      createdAt: new Date().toISOString(),
    }
    const key = `sess:${userId}:${tokenHash}`
    await client.setex(key, 30 * 24 * 60 * 60, JSON.stringify(meta))

    const tokens = await this.authRepo.listUserRefreshTokens(userId)
    const sorted = tokens.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    const excess = sorted.length - this.maxSessions
    if (excess > 0) {
      for (let i = 0; i < excess; i++) {
        const victim = sorted[i]
        if (victim) {
          await this.authRepo.revokeRefreshTokenById(victim.id)
          await client.del(`sess:${userId}:${victim.token_hash}`)
        }
      }
    }
  }

  async revokeAll(userId: string): Promise<void> {
    const tokens = await this.authRepo.listUserRefreshTokens(userId)
    for (const t of tokens) {
      await this.authRepo.revokeRefreshTokenById(t.id)
      const client = await redisClient()
      await client.del(`sess:${userId}:${t.token_hash}`)
    }
  }
}
