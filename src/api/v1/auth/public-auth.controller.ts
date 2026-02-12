import type { Request, Response } from '@/src/api/v1/middleware';
import type {
  PublicSignupRequest,
  PublicSignupResponse,
} from '@/src/types/public-auth';
import type { ApiErrorResponse } from '@/src/types/api';
import { PublicAuthService } from '@/src/api/v1/auth/public-auth.service';

const publicAuthService = new PublicAuthService();

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isPublicSignupBody(body: unknown): body is PublicSignupRequest {
  if (!isRecord(body)) {
    return false;
  }
  return (
    isString(body.email) &&
    isString(body.password) &&
    isString(body.tenantName) &&
    isString(body.tenantSlug)
  );
}

export async function publicSignup(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body;

  if (!isPublicSignupBody(body)) {
    const errorBody: ApiErrorResponse = {
      error: 'Bad Request',
      message: 'Invalid signup payload',
    };
    res.status = 400;
    res.body = errorBody;
    return;
  }

  const input: PublicSignupRequest = {
    email: body.email.trim(),
    password: body.password,
    tenantName: body.tenantName.trim(),
    tenantSlug: body.tenantSlug.trim(),
  };

  try {
    const result: PublicSignupResponse = await publicAuthService.signup(input);
    res.status = 200;
    res.body = result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_SIGNUP_PAYLOAD') {
        const errorBody: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid signup payload',
        };
        res.status = 400;
        res.body = errorBody;
        return;
      }

      if (error.message === 'TENANT_SLUG_TAKEN') {
        const errorBody: ApiErrorResponse = {
          error: 'Conflict',
          message: 'Tenant slug already in use',
        };
        res.status = 409;
        res.body = errorBody;
        return;
      }

      const errorBody: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: error.message,
      };
      res.status = 500;
      res.body = errorBody;
      return;
    }

    const errorBody: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: 'Unexpected error',
    };
    res.status = 500;
    res.body = errorBody;
  }
}

