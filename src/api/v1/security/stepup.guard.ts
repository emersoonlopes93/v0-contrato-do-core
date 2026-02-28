import crypto from 'crypto'
import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import type { SaaSAdminToken } from '@/src/core/auth/contracts'
import { JWTService } from '@/src/core/auth/jwt'

type StepUpGrant = {
  userId: string
  action: string
  mfa: true
}

const DEFAULT_TTL_SEC = Number(process.env.STEPUP_TTL_SEC ?? '300')

function bearer(tokenHeader: string | undefined): string | null {
  if (!tokenHeader) return null
  const t = tokenHeader.trim()
  if (!t.toLowerCase().startsWith('bearer ')) return null
  return t.slice(7).trim()
}

export async function issueStepUpToken(userId: string, action: string, ttlSec: number = DEFAULT_TTL_SEC): Promise<string> {
  const client = await redisClient()
  const id = crypto.randomUUID()
  const key = `stepup:${id}`
  const payload: StepUpGrant = { userId, action, mfa: true }
  await client.setex(key, ttlSec, JSON.stringify(payload))
  return id
}

export const requireStepUpForAction = (action: string): Middleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const client = await redisClient()
    const headerToken = typeof req.headers['x-stepup-token'] === 'string' ? req.headers['x-stepup-token'] : null
    const cookieHeader = typeof req.headers['cookie'] === 'string' ? req.headers['cookie'] : ''
    const cookieMatch = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith('saas_stepup='))
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch.slice('saas_stepup='.length)) : null
    const token = headerToken ?? cookieToken
    if (!token) {
      res.status = 401
      res.body = { error: 'Step-up token required' }
      return
    }
    const raw = await client.get(`stepup:${token}`)
    if (!raw) {
      res.status = 401
      res.body = { error: 'Invalid step-up token' }
      return
    }
    let grant: StepUpGrant | null = null
    try {
      grant = JSON.parse(raw) as StepUpGrant
    } catch {
      grant = null
    }
    if (!grant || grant.action !== action) {
      res.status = 401
      res.body = { error: 'Step-up scope mismatch' }
      return
    }
    const bearerToken = bearer(req.headers['authorization'])
    if (!bearerToken) {
      res.status = 401
      res.body = { error: 'Authorization required' }
      return
    }
    const payload = JWTService.verifySaaSAdminToken(bearerToken) as SaaSAdminToken
    if (payload.userId !== grant.userId) {
      res.status = 401
      res.body = { error: 'User mismatch' }
      return
    }
    await client.del(`stepup:${token}`)
    await next()
  }
}
