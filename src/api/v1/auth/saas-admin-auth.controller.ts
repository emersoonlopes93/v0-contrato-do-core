/**
 * SaaS Admin Auth Controller
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import { Request, Response } from '../middleware';
import { SaaSAdminAuthService } from '../../../core/auth/saas-admin/saas-admin-auth.service';
import type { SaaSAdminLoginRequest } from '@/core/auth';

const saasAuth = new SaaSAdminAuthService();

function buildDevCookie(name: string, value: string): string {
  const encoded = encodeURIComponent(value);
  return `${name}=${encoded}; HttpOnly; SameSite=Lax; Path=/`;
}

function parseCookieValue(cookieHeader: string, key: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${key}=`)) continue;
    const value = trimmed.slice(key.length + 1);
    const decoded = decodeURIComponent(value);
    return decoded.length > 0 ? decoded : null;
  }
  return null;
}

function isSaaSAdminLoginRequest(
  body: unknown,
): body is SaaSAdminLoginRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.email === 'string' &&
    typeof candidate.password === 'string'
  );
}

export async function saasAdminLogin(req: Request, res: Response) {
  const body = req.body;

  if (!isSaaSAdminLoginRequest(body)) {
    res.status = 400;
    res.body = { error: 'Email and password are required' };
    return;
  }

  const { email, password } = body;

  try {
    const result = await saasAuth.login({ email, password });
    res.status = 200;
    res.headers = {
      'Set-Cookie': [
        buildDevCookie('saas_auth_token', result.accessToken),
        buildDevCookie('saas_refresh_token', result.refreshToken),
      ],
    };
    res.body = {
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    };
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error:
        error instanceof Error
          ? error.message
          : 'Authentication failed',
    };
  }
}

function isRefreshBody(body: unknown): body is { refreshToken: string } {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return typeof candidate.refreshToken === 'string' && candidate.refreshToken.trim().length > 0;
}

export async function saasAdminRefresh(req: Request, res: Response) {
  const cookieHeader = req.headers['cookie'];
  const cookieRefresh =
    typeof cookieHeader === 'string'
      ? parseCookieValue(cookieHeader, 'saas_refresh_token')
      : null;

  const body = req.body;
  const bodyRefresh = isRefreshBody(body) ? body.refreshToken : null;
  const refreshToken = cookieRefresh ?? bodyRefresh;

  if (!refreshToken) {
    res.status = 400;
    res.body = { error: 'refreshToken is required' };
    return;
  }

  try {
    const result = await saasAuth.refreshToken(refreshToken);
    res.status = 200;
    res.headers = {
      'Set-Cookie': [buildDevCookie('saas_auth_token', result.accessToken)],
    };
    res.body = { ok: true };
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error: error instanceof Error ? error.message : 'Refresh token inválido',
    };
  }
}
