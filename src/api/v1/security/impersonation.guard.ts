import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import { recordStepupFailureMetric } from '@/src/api/v1/stats/metrics'

export const denyImpersonationForAction = (actionId: string): Middleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = typeof req.headers['x-impersonation-token'] === 'string' ? req.headers['x-impersonation-token'] : null
    if (!token) {
      await next()
      return
    }
    const client = await redisClient()
    const raw = await client.get(`imp:${token}`)
    if (raw) {
      recordStepupFailureMetric()
      res.status = 403
      res.body = { error: 'Forbidden', message: `Operation '${actionId}' not allowed under impersonation` }
      return
    }
    await next()
  }
}
