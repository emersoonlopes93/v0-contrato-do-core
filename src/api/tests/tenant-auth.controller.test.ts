import { describe, it, expect } from 'vitest';
import type { Request, Response } from '@/src/api/v1/middleware';
import { tenantLogin } from '@/src/api/v1/auth/tenant-auth.controller';

describe('tenantLogin', () => {
  it('deve retornar 400 quando tenant não for resolvido', async () => {
    const req: Request = {
      method: 'POST',
      url: '/api/v1/auth/tenant/login',
      headers: {},
      body: { email: 'user@test.local', password: 'password123' },
    };

    const res: Response = {
      status: 200,
      body: undefined,
    };

    await tenantLogin(req, res);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Tenant não resolvido' });
  });
});

