import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantApi } from '@/src/tenant/lib/tenantApi';

describe('tenantApi refresh token', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retries request after 401 by refreshing token', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/v1/auth/tenant/refresh')) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (!init || (init && init.method !== 'GET')) {
        return new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 });
      }
      // First GET returns 401
      const typedMock = fetchMock as unknown as { calledOnce?: boolean };
      if (typedMock.calledOnce !== true) {
        typedMock.calledOnce = true;
        return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Token expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 });
    });

    const data = await tenantApi.get<{ success: boolean; data: unknown }>('/api/v1/tenant/test', { tenantSlug: 'demo' });
    expect(data).toBeDefined();
    expect((data as { success?: boolean }).success).toBe(true);
  });
});
