import { describe, it, expect } from 'vitest'
import { routes } from '@/src/api/v1'
import { adminRBACEnforcer } from '@/src/api/v1/security/admin-permissions'
import { requireSaaSAdminAuth, requestLogger, errorHandler } from '@/src/api/v1/middleware'

describe('SaaS-Admin RBAC enforcement', () => {
  it('all admin routes include adminRBACEnforcer', () => {
    const adminRoutes = routes.filter((r) => r.path.startsWith('/api/v1/admin'))
    for (const r of adminRoutes) {
      expect(r.middlewares.includes(adminRBACEnforcer)).toBe(true)
      expect(r.middlewares.includes(requireSaaSAdminAuth)).toBe(true)
      expect(r.middlewares.includes(requestLogger)).toBe(true)
      expect(r.middlewares.includes(errorHandler)).toBe(true)
    }
  })
})
