import { requireSaaSAdminAuth, type Request, type Response, type Route, requestLogger, errorHandler } from '@/src/api/v1/middleware';
import { adminRBACEnforcer } from '@/src/api/v1/security/admin-permissions';
import { snapshotMetrics } from '@/src/api/v1/security/security-metrics';
import type { SecurityMetricsSnapshot } from '@/src/types/security';

export async function getSecurityMetrics(req: Request, res: Response) {
  res.status = 200;
  const body: SecurityMetricsSnapshot = { metrics: snapshotMetrics() };
  res.body = body;
}

export const saasAdminSecurityRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/admin/security/metrics',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: getSecurityMetrics,
  },
];
