import { describe, it, expect } from 'vitest';
import { routes } from '@/src/api/v1';
import { requireTenantAuth, errorHandler, requestLogger } from '@/src/api/v1/middleware';

const WHITELIST: ReadonlySet<string> = new Set([
  '/api/v1/tenant/onboard/complete',
  '/api/v1/tenant/white-label',
]);

describe('RBAC route guard', () => {
  it('tenant routes must include requireTenantAuth', () => {
    const tenantRoutes = routes.filter((r) => r.path.startsWith('/api/v1/tenant/'));
    for (const r of tenantRoutes) {
      expect(r.middlewares.includes(requireTenantAuth)).toBe(true);
    }
  });

  it('tenant routes must include module or permission guard (except whitelist)', () => {
    const tenantRoutes = routes.filter((r) => r.path.startsWith('/api/v1/tenant/'));
    for (const r of tenantRoutes) {
      if (WHITELIST.has(r.path)) continue;
      const hasSpecificGuard = r.middlewares.some((m) => {
        if (m === requireTenantAuth || m === requestLogger || m === errorHandler) return false;
        const s = Function.prototype.toString.call(m);
        return s.includes('MODULE_NOT_ACTIVE') || s.includes('INSUFFICIENT_PERMISSIONS');
      });
      expect(hasSpecificGuard).toBe(true);
    }
  });
});
