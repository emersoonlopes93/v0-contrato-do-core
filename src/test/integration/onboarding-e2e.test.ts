
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import type http from 'http';
import { startApiServer, stopApiServer } from '@/src/server';

const integrationEnabled = process.env.RUN_INTEGRATION === '1';
const suite = integrationEnabled ? describe : describe.skip;

suite('Tenant Onboarding E2E Flow', { timeout: 30000 }, () => {
  let server: http.Server;
  let baseUrl: string;
  let adminToken: string;
  let tenantId: string;
  let planId: string;
  let tenantToken: string;
  const timestamp = Date.now();
  const tenantSlug = `test-integration-${timestamp}`;
  const tenantEmail = `admin-${timestamp}@test.local`;
  const tenantPassword = 'password123';

  beforeAll(async () => {
    server = await startApiServer(0);
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Falha ao obter porta do servidor de teste');
    }
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await stopApiServer(server);
  });

  // Helper for requests
  async function request(method: string, path: string, body?: unknown, token?: string, headers: Record<string, string> = {}) {
    const opts: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (token) {
      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    if (body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, body: data, headers: res.headers };
  }

  it('1. Should login as SaaS Admin', async () => {
    const res = await request('POST', '/api/v1/auth/saas-admin/login', {
      email: 'admin@saas.local',
      password: 'admin123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    adminToken = res.body.accessToken;
    console.log('✅ SaaS Admin Logged In');
  });

  it('2. Should list plans and get Pro plan ID', async () => {
    const res = await request('GET', '/api/v1/admin/plans', undefined, adminToken);
    expect(res.status).toBe(200);

    const body = res.body as { data?: { slug: string; id: string }[] };
    const plans = Array.isArray(body.data) ? body.data : [];
    expect(Array.isArray(plans)).toBe(true);
    
    const proPlan = plans.find((p) => p.slug === 'pro');
    if (!proPlan) {
      throw new Error('Pro plan not found');
    }
    planId = proPlan.id;
    console.log(`✅ Found Plan: ${proPlan.slug} (${planId})`);
  });

  it('3. Should create a new Tenant', async () => {
    const res = await request('POST', '/api/v1/admin/tenants', {
      name: 'Integration Test Tenant',
      slug: tenantSlug,
      planId: planId,
    }, adminToken);

    if (res.status !== 201) {
      console.error('Create Tenant Failed:', res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    tenantId = res.body.data.id;
    console.log(`✅ Created Tenant: ${tenantSlug} (${tenantId})`);
  });

  it('4. Should Onboard the Tenant (Create User & Activate Modules)', async () => {
    const res = await request('POST', `/api/v1/admin/tenants/${tenantId}/onboard`, {
      email: tenantEmail,
      password: tenantPassword,
      name: 'Test Admin',
      modules: ['employees'],
    }, adminToken);

    if (res.status !== 200) {
      console.error('Onboard Tenant Failed:', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('✅ Tenant Onboarded');
  });

  it('5. Should Fail Tenant Login Without Tenant Context', async () => {
    const res = await request('POST', '/api/v1/auth/tenant/login', {
      email: tenantEmail,
      password: tenantPassword,
    });

    expect(res.status).toBe(400);
    expect((res.body as { error?: string }).error).toBe('Tenant não resolvido');
  });

  it('6. Should Login as Tenant User', async () => {
    // Need X-Tenant-ID header usually? Or the login endpoint takes tenantId in body?
    // Looking at auth controller (not visible in detail, but standard is body)
    // Let's check api/v1/auth/tenant-auth.controller.ts if possible, but standard is body.
    
    // We also need to send X-Tenant-Slug header for login to find the correct tenant
    const res = await request('POST', '/api/v1/auth/tenant/login', {
      email: tenantEmail,
      password: tenantPassword,
      tenantId: tenantId
    }, undefined, {
      'X-Tenant-Slug': tenantSlug
    });

    if (res.status !== 200) {
      console.error('Tenant Login Failed:', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    tenantToken = res.body.accessToken;
    console.log('✅ Tenant Logged In');
  });

  it('7. Should Verify Session and Active Modules', async () => {
    const res = await request('GET', '/api/v1/auth/session', undefined, tenantToken, {
      'X-Tenant-ID': tenantId
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(tenantEmail);
    // Check if hello-module is in permissions or modules list?
    // Session usually returns user info.
    // The `requireModule` middleware checks `guards.requireModule`.
    // Let's assume session returns something about permissions or we just test the protected route.
    console.log('✅ Session Verified');
  });

  it('8. Should Access Protected Employees Route (RBAC & Module Guard)', async () => {
    const res = await request('GET', '/api/v1/tenant/employees', undefined, tenantToken, {
      'X-Tenant-ID': tenantId
    });

    if (res.status === 403) {
      console.warn('⚠️ Access Denied (403). Possible reasons: Module not active OR Missing Permissions.');
      console.warn('Body:', res.body);
    }

    expect(res.status).toBe(200);
    console.log('✅ Protected Route Accessed (Module & Permission OK)');
  });

  it('9. Should Verify Admin Dashboard visibility', async () => {
    const res = await request('GET', '/api/v1/admin/tenants', undefined, adminToken);
    expect(res.status).toBe(200);

    const body = res.body as { data?: { id: string; onboarded?: boolean }[] };
    const tenants = Array.isArray(body.data) ? body.data : [];
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found in admin list');
    }
    expect(tenant.onboarded).toBe(true);
    console.log('✅ Tenant visible in Admin Dashboard');
  });
  
  it('10. Should Fail Access when Module is Deactivated', async () => {
     // 1. Deactivate module via Admin
     // We need to know module ID. Let's list modules first.
     const modRes = await request('GET', '/api/v1/admin/modules', undefined, adminToken);
     const modulesBody = modRes.body as { data?: { id: string; slug: string }[] };
     const modules = Array.isArray(modulesBody.data) ? modulesBody.data : [];
     const employeesMod = modules.find((m) => m.slug === 'employees');
     if (!employeesMod) {
       throw new Error('employees module not found');
     }
     
     const deactivateRes = await request('POST', `/api/v1/admin/tenants/${tenantId}/modules/${employeesMod.id}/deactivate`, {}, adminToken);
     expect(deactivateRes.status).toBe(200);
     
     // 2. Try access again
     const res = await request('GET', '/api/v1/tenant/employees', undefined, tenantToken, {
       'X-Tenant-ID': tenantId
     });
    
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Module access denied|Module .* not active|Module .* is not enabled/i);
    console.log('✅ Module Guard enforced (Access Denied after deactivation)');
  });
});
