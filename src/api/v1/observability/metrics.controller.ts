import type { Request, Response, Route } from '@/src/api/v1/middleware'
import { metrics } from '@/src/api/v1/stats/metrics'
import { requireSaaSAdminAuth, requestLogger, errorHandler } from '@/src/api/v1/middleware'
import { adminRBACEnforcer } from '@/src/api/v1/security/admin-permissions'

export async function getMetrics(req: Request, res: Response): Promise<void> {
  const body = metrics.renderPrometheus()
  res.status = 200
  res.headers = { ...(res.headers ?? {}), 'Content-Type': 'text/plain; version=0.0.4' }
  res.body = body
}

export const metricsRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/admin/metrics',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: getMetrics,
  },
]
