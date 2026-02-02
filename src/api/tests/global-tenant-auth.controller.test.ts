import { describe, it, expect } from 'vitest';
import type { Request, Response } from '@/src/api/v1/middleware';
import { tenantGlobalLogin } from '@/src/api/v1/auth/global-tenant-auth.controller';

describe('tenantGlobalLogin', () => {
  it('deve retornar 400 quando payload for inválido', async () => {
    const req: Request = {
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: {},
      body: null,
    };

    const res: Response = {
      status: 200,
      body: undefined,
    };

    await tenantGlobalLogin(req, res);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Email and password are required' });
  });
});

