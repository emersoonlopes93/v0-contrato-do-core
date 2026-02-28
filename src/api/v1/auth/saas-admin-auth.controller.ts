/**
 * SaaS Admin Auth Controller
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import { Request, Response } from '../middleware';
import { SaaSAdminAuthService } from '../../../core/auth/saas-admin/saas-admin-auth.service';
import type { SaaSAdminLoginRequest } from '@/core/auth';
import { getLoginKey, isLoginRateLimited, recordLoginFailure, recordLoginSuccess } from '../security/login-rate-limit';
import { isLockedOut, recordFailure as recordLockFailure, recordSuccess as recordLockSuccess } from '../security/lockout';
import { logLoginFailure, logLoginSuccess } from '../security/security-metrics';
import { createMfaChallenge, verifyMfaChallenge } from '../security/mfa-store';
import type { SaaSAdminMfaVerifyRequest, SaaSAdminMfaInitResponse, SaaSAdminMfaVerifyResponse } from '@/src/types/auth-mfa';
import { SessionPolicyService } from '../security/session-policy.service';

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
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const ip = typeof forwarded === 'string' && forwarded.trim() !== '' ? forwarded.split(',')[0]!.trim() : typeof real === 'string' && real.trim() !== '' ? real.trim() : 'unknown';
  const rateKey = getLoginKey(ip, email);
  if (await isLockedOut(ip, email)) {
    res.status = 423;
    res.body = { error: 'Locked', message: 'Account temporarily locked due to repeated failures' };
    return;
  }
  if (await isLoginRateLimited(rateKey)) {
    res.status = 429;
    res.body = { error: 'Too Many Requests', message: 'Too many login attempts. Please try again later.' };
    return;
  }

  try {
    const mfaEnabled = process.env.SAAS_ADMIN_MFA_ENABLED !== 'false';
    if (mfaEnabled) {
      const user = await saasAuth.validateCredentials({ email, password });
      const challenge = await createMfaChallenge(user.id);
      const response: SaaSAdminMfaInitResponse = { mfaRequired: true };
      await recordLoginSuccess(rateKey);
      await recordLockSuccess(ip, email);
      logLoginSuccess('admin', ip, email);
      res.status = 200;
      res.headers = {
        'Set-Cookie': [buildDevCookie('saas_mfa_challenge', challenge.challengeId)],
      };
      res.body = response;
      return;
    }
    const result = await saasAuth.login({ email, password });
    await recordLoginSuccess(rateKey);
    await recordLockSuccess(ip, email);
    logLoginSuccess('admin', ip, email);
    const device = typeof req.headers['x-device-fingerprint'] === 'string' ? req.headers['x-device-fingerprint'] : null;
    const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;
    await new SessionPolicyService().registerSession(result.user.id, result.refreshToken, device, ip, ua);
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
    await recordLoginFailure(rateKey);
    await recordLockFailure(ip, email);
    logLoginFailure('admin', ip, email);
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
      'Set-Cookie': [
        buildDevCookie('saas_auth_token', result.accessToken),
        buildDevCookie('saas_refresh_token', result.refreshToken),
      ],
    };
    res.body = { ok: true };
  } catch (error: unknown) {
    res.status = 401;
    res.body = {
      error: error instanceof Error ? error.message : 'Refresh token inválido',
    };
  }
}

function isMfaVerifyBody(body: unknown): body is SaaSAdminMfaVerifyRequest {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return typeof candidate.code === 'string' && candidate.code.trim().length > 0;
}

export async function saasAdminMfaVerify(req: Request, res: Response) {
  const body = req.body;
  if (!isMfaVerifyBody(body)) {
    res.status = 400;
    res.body = { error: 'code is required' };
    return;
  }
  const cookieHeader = req.headers['cookie'];
  const challengeId =
    typeof cookieHeader === 'string'
      ? parseCookieValue(cookieHeader, 'saas_mfa_challenge')
      : null;
  if (!challengeId) {
    res.status = 400;
    res.body = { error: 'MFA challenge missing' };
    return;
  }
  const device = typeof req.headers['x-device-fingerprint'] === 'string' ? req.headers['x-device-fingerprint'] : null;
  const userId = await verifyMfaChallenge(challengeId, body.code.trim(), device);
  if (!userId) {
    res.status = 401;
    res.body = { error: 'Invalid code' };
    return;
  }
  const result = await saasAuth.issueTokensForUser(userId);
  const stepupAction = typeof req.headers['x-stepup-action'] === 'string' ? req.headers['x-stepup-action'] : null;
  let stepupCookie: string | null = null;
  if (stepupAction) {
    const t = await (await import('../security/stepup.guard')).issueStepUpToken(userId, stepupAction);
    stepupCookie = buildDevCookie('saas_stepup', t);
  }
  const response: SaaSAdminMfaVerifyResponse = {
    ok: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  };
  res.status = 200;
  res.headers = {
    'Set-Cookie': [
      buildDevCookie('saas_auth_token', result.accessToken),
      buildDevCookie('saas_refresh_token', result.refreshToken),
      ...(stepupCookie ? [stepupCookie] : []),
    ],
  };
  res.body = response;
}
