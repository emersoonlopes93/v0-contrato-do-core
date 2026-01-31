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
    res.body = { accessToken: result.accessToken };
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
