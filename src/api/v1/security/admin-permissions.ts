import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import type { AuthenticatedRequest } from '@/src/api/v1/middleware'

type AdminPermission = string

type AdminRouteKey = `${'GET'|'POST'|'PATCH'|'DELETE'|'PUT'} ${string}`

const POLICY: Record<AdminRouteKey, AdminPermission> = {
  'GET /api/v1/admin/dashboard': 'admin.dashboard.read',
  'GET /api/v1/admin/tenants': 'admin.tenants.read',
  'POST /api/v1/admin/tenants': 'admin.tenants.create',
  'GET /api/v1/admin/tenants/:tenantId': 'admin.tenants.read',
  'PATCH /api/v1/admin/tenants/:tenantId/status': 'admin.tenants.status',
  'POST /api/v1/admin/tenants/:tenantId/onboard': 'admin.tenants.onboard',
  'PATCH /api/v1/admin/tenants/:tenantId/plan': 'admin.plans.assign',
  'PATCH /api/v1/admin/tenants/:tenantId/modules': 'admin.modules.set',
  'POST /api/v1/admin/tenants/:tenantId/users': 'admin.tenants.user.create',
  'POST /api/v1/admin/tenants/:tenantId/modules/:moduleId/activate': 'admin.modules.activate',
  'POST /api/v1/admin/tenants/:tenantId/modules/:moduleId/deactivate': 'admin.modules.deactivate',
  'GET /api/v1/admin/plans': 'admin.plans.read',
  'POST /api/v1/admin/plans': 'admin.plans.create',
  'PATCH /api/v1/admin/plans/:id': 'admin.plans.update',
  'GET /api/v1/admin/modules': 'admin.modules.read',
  'GET /api/v1/admin/white-label/:tenantId': 'admin.whitelabel.read',
  'PATCH /api/v1/admin/white-label/:tenantId': 'admin.whitelabel.update',
  'POST /api/v1/admin/white-label/:tenantId/init': 'admin.whitelabel.init',
  'GET /api/v1/admin/audit': 'admin.audit.read',
  'GET /api/v1/admin/security/metrics': 'admin.security.read',
  'GET /api/v1/admin/sessions': 'admin.sessions.read',
  'POST /api/v1/admin/sessions/revoke': 'admin.sessions.revoke',
  'POST /api/v1/admin/sessions/revoke-all': 'admin.sessions.revoke_all',
}

const ROLE_MATRIX: Record<string, ReadonlySet<AdminPermission>> = {
  admin: new Set<AdminPermission>(Object.values(POLICY)),
  moderator: new Set<AdminPermission>([
    'admin.dashboard.read',
    'admin.tenants.read',
    'admin.modules.read',
    'admin.plans.read',
    'admin.audit.read',
    'admin.security.read',
    'admin.sessions.read',
  ]),
}

export const adminRBACEnforcer: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  const auth = (req as AuthenticatedRequest).auth
  if (!auth || !auth.role) {
    res.status = 401
    res.body = { error: 'Unauthorized' }
    return
  }
  const role = auth.role
  const routeKey: AdminRouteKey = `${req.method as 'GET'|'POST'|'PATCH'|'DELETE'|'PUT'} ${req.url}`
  const required = POLICY[routeKey]
  if (!required) {
    res.status = 403
    res.body = { error: 'Forbidden', message: 'RBAC policy missing' }
    return
  }
  const allowed = ROLE_MATRIX[role]
  if (!allowed || !allowed.has(required)) {
    res.status = 403
    res.body = { error: 'Forbidden', message: 'Insufficient admin permissions' }
    return
  }
  await next()
}
