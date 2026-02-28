import crypto from 'crypto'
import type { Middleware, Request, Response, NextFunction, AuthenticatedRequest } from '@/src/api/v1/middleware'
import { logger } from '@/src/api/logger'
import { metrics, observeDuration } from '@/src/api/v1/stats/metrics'

export const requestContext: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const rid = crypto.randomUUID()
  const ipHeader = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  const ip = typeof ipHeader === 'string' && ipHeader.trim() !== '' ? ipHeader.split(',')[0]!.trim() : 'unknown'
  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined
  req.headers['x-request-id'] = rid

  logger.info('request:start', { request_id: rid, ip, user_agent: ua })
  try {
    await next()
    const duration = Date.now() - start
    observeDuration(duration)
    logger.info('request:end', {
      request_id: rid,
      actor_id: (req as AuthenticatedRequest).auth?.userId,
      tenant_id: (req as AuthenticatedRequest).auth?.tenantId,
      ip,
      user_agent: ua,
      context: { status: res.status },
    })
  } catch (err) {
    const duration = Date.now() - start
    observeDuration(duration)
    metrics.inc('error_rate')
    logger.error('request:error', {
      request_id: rid,
      actor_id: (req as AuthenticatedRequest).auth?.userId,
      tenant_id: (req as AuthenticatedRequest).auth?.tenantId,
      ip,
      user_agent: ua,
    })
    throw err
  }
}
