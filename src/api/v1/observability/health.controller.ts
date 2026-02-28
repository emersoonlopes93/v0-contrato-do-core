import type { Request, Response, Route } from '@/src/api/v1/middleware'
import { getPrismaClient } from '@/src/adapters/prisma/client'
import { requireSaaSAdminAuth, requestLogger, errorHandler } from '@/src/api/v1/middleware'
import { adminRBACEnforcer } from '@/src/api/v1/security/admin-permissions'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import { globalEventBus } from '@/src/core'

export async function getHealth(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient()
  let dbOk = false
  let redisOk = false
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    dbOk = true
  } catch {
    dbOk = false
  }
  try {
    const rc = await redisClient()
    await rc.set('health:probe', '1')
    await rc.del('health:probe')
    redisOk = true
  } catch {
    redisOk = false
  }
  const eventMetrics = (globalEventBus as unknown as { metrics?: Record<string, number> }).metrics ?? {}
  const memory = process.memoryUsage()
  const uptime = process.uptime()
  res.status = 200
  res.body = {
    ok: dbOk && redisOk,
    db: dbOk,
    redis: redisOk,
    eventBus: eventMetrics,
    uptime,
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    },
  }
}

export const healthRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/admin/health',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: getHealth,
  },
]
