import { requireSaaSAdminAuth, type Request, type Response, type Route, requestLogger, errorHandler } from '@/src/api/v1/middleware';
import { adminRBACEnforcer } from '@/src/api/v1/security/admin-permissions';
import { AuthRepository } from '@/src/adapters/prisma/repositories/auth-repository';
import type { ListSessionsResponse, RevokeSessionRequest, GenericOkResponse } from '@/src/types/sessions';

const authRepo = new AuthRepository();

function isRevokeBody(body: unknown): body is RevokeSessionRequest {
  if (typeof body !== 'object' || body === null) return false;
  const c = body as Record<string, unknown>;
  return typeof c.id === 'string' && c.id.trim().length > 0;
}

export async function listSessions(req: Request, res: Response) {
  const headers = req.headers;
  const token = headers['authorization'];
  if (typeof token !== 'string' || token.trim() === '') {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
    return;
  }
  try {
    const ctx = await new (await import('@/src/core/auth/guards')).AuthGuards().requireSaaSAdmin({ token });
    const rows = await authRepo.listUserRefreshTokens(ctx.token.userId);
    const response: ListSessionsResponse = {
      sessions: rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at.toISOString(),
        expiresAt: r.expires_at.toISOString(),
        revoked: r.revoked,
      })),
    };
    res.status = 200;
    res.body = response;
  } catch {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
  }
}

export async function revokeSession(req: Request, res: Response) {
  const headers = req.headers;
  const token = headers['authorization'];
  if (typeof token !== 'string' || token.trim() === '') {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
    return;
  }
  if (!isRevokeBody(req.body)) {
    res.status = 400;
    res.body = { error: 'id is required' };
    return;
  }
  try {
    await new (await import('@/src/core/auth/guards')).AuthGuards().requireSaaSAdmin({ token });
    await authRepo.revokeRefreshTokenById(req.body.id);
    const response: GenericOkResponse = { ok: true };
    res.status = 200;
    res.body = response;
  } catch {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
  }
}

export async function revokeAllSessions(req: Request, res: Response) {
  const headers = req.headers;
  const token = headers['authorization'];
  if (typeof token !== 'string' || token.trim() === '') {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
    return;
  }
  try {
    const ctx = await new (await import('@/src/core/auth/guards')).AuthGuards().requireSaaSAdmin({ token });
    await authRepo.revokeAllUserRefreshTokens(ctx.token.userId);
    const response: GenericOkResponse = { ok: true };
    res.status = 200;
    res.body = response;
  } catch {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
  }
}

export const saasAdminSessionRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/admin/sessions',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: listSessions,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/sessions/revoke',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: revokeSession,
  },
  {
    method: 'POST',
    path: '/api/v1/admin/sessions/revoke-all',
    middlewares: [requestLogger, errorHandler, requireSaaSAdminAuth, adminRBACEnforcer],
    handler: revokeAllSessions,
  },
];
