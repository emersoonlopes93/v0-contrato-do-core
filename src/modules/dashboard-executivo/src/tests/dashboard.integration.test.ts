import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import type http from 'http';
import { startApiServer, stopApiServer } from '@/src/server';
import { getPrismaClient } from '@/src/adapters/prisma/client';
import bcrypt from 'bcryptjs';

const integrationEnabled = process.env.RUN_INTEGRATION === '1';
// Run only if integration tests are enabled, otherwise skip
const suite = integrationEnabled ? describe : describe.skip;

suite('Dashboard Executivo Integration', { timeout: 30000 }, () => {
  let server: http.Server;
  let baseUrl: string;
  const prisma = getPrismaClient();

  const timestamp = Date.now();
  const tenantSlug = `dashboard-test-${timestamp}`;
  const tenantEmail = `owner-${timestamp}@dashboard.local`;
  const tenantPassword = 'password123';
  let tenantId: string;
  let authToken: string;

  beforeAll(async () => {
    server = await startApiServer(0);
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Falha ao obter porta do servidor de teste');
    }
    baseUrl = `http://localhost:${address.port}`;

    // Setup Data
    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Dashboard Test Tenant',
        slug: tenantSlug,
        status: 'active',
      },
    });
    tenantId = tenant.id;

    // 2. Create Module and Permission
    const module = await prisma.module.create({
      data: {
        name: 'Dashboard Executivo',
        slug: 'dashboard-executivo',
        description: 'Dashboard module',
        version: '1.0.0',
        permissions: JSON.stringify([]),
      },
    });

    const permission = await prisma.permission.create({
      data: {
        module_id: module.id,
        name: 'View Dashboard',
        slug: 'dashboard-executivo.view',
        description: 'View dashboard permission',
      },
    });

    // Activate module for tenant
    await prisma.tenantModule.create({
      data: {
        tenant_id: tenantId,
        module_id: module.id,
        status: 'active',
      },
    });

    // 3. Create Role OWNER with permission
    const role = await prisma.role.create({
      data: {
        tenant_id: tenantId,
        name: 'OWNER',
        slug: 'owner',
        description: 'Owner Role',
        rolePermissions: {
          create: {
            permission_id: permission.id,
          },
        },
      },
    });

    // 4. Create User
    const passwordHash = await bcrypt.hash(tenantPassword, 10);
    const user = await prisma.tenantUser.create({
      data: {
        tenant_id: tenantId,
        email: tenantEmail,
        password_hash: passwordHash,
        name: 'Dashboard Owner',
        status: 'active',
      },
    });

    // 4. Assign Role
    await prisma.userRole.create({
      data: {
        tenant_id: tenantId,
        user_id: user.id,
        role_id: role.id,
      },
    });

    // 5. Create Orders for Dashboard Data
    // Today
    await prisma.order.create({
      data: {
        tenant_id: tenantId,
        order_number: 1,
        source: 'app',
        total: 100,
        status: 'completed',
        customer_phone: '1234567890',
        created_at: new Date(),
        items: { create: [] },
      },
    });

    // 15 days ago (Last 30 days)
    const date15DaysAgo = new Date();
    date15DaysAgo.setDate(date15DaysAgo.getDate() - 15);
    await prisma.order.create({
      data: {
        tenant_id: tenantId,
        order_number: 2,
        source: 'app',
        total: 200,
        status: 'delivered',
        customer_phone: '1234567890',
        created_at: date15DaysAgo,
        items: { create: [] },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.tenant.deleteMany({ 
      where: {
        id: tenantId,
      },
    });
    
    await prisma.module.deleteMany({
      where: {
        name: 'Dashboard Executivo',
      },
    });

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

  it('should login and get token', async () => {
    const res = await request('POST', '/api/v1/auth/tenant/login', {
      email: tenantEmail,
      password: tenantPassword,
    }, undefined, {
      'x-tenant-slug': tenantSlug,
    });

    if (res.status !== 200) {
      console.error('Login failed. Status:', res.status);
      console.error('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    
    // Extract token from Set-Cookie header
    // Node.js fetch Headers object has getSetCookie() method
    const headers = res.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = typeof headers.getSetCookie === 'function' 
      ? headers.getSetCookie() 
      : [headers.get('set-cookie')]; // Fallback
      
    const tokenCookie = cookies.find(
      (c): c is string => typeof c === 'string' && c.startsWith('tenant_auth_token=')
    );
    
    expect(tokenCookie).toBeDefined();
    
    if (tokenCookie) {
      const cookieValue = tokenCookie.split(';')[0];
      if (cookieValue) {
        const tokenValue = cookieValue.split('=')[1];
        if (tokenValue) {
          authToken = decodeURIComponent(tokenValue);
        }
      }
    }
    
    expect(authToken).toBeDefined();
  });

  it('should get dashboard data', async () => {
    const res = await request('GET', '/api/dashboard/executivo?period=30d', undefined, authToken);

    expect(res.status).toBe(200);
    const data = res.body;

    // Verify structure
    expect(data.receita).toBeDefined();
    expect(data.receita.hoje).toBe(100);
    // 100 (today) + 200 (15 days ago) = 300
    expect(data.receita.ultimos30dias).toBe(300);
    
    expect(data.ticketMedio).toBeDefined();
    expect(data.ticketMedio.hoje).toBe(100); // 100 / 1 order
    
    expect(data.clientesAtivos30d).toBeGreaterThan(0);
  });

  it('should return 401 without token', async () => {
    const res = await request('GET', '/api/dashboard/executivo', undefined);
    expect(res.status).toBe(401);
  });

  it('should return 403 if user lacks permission', async () => {
    // Create a user without permission
    const userNoPerm = await prisma.tenantUser.create({
      data: {
        tenant_id: tenantId,
        email: `noperm-${timestamp}@test.local`,
        password_hash: await bcrypt.hash('password123', 10),
        name: 'No Permission User',
        status: 'active',
      },
    });

    // Create Role without permission
    const roleNoPerm = await prisma.role.create({
      data: {
        tenant_id: tenantId,
        name: 'STAFF',
        slug: 'staff-noperm',
        description: 'Staff Role',
      },
    });

    await prisma.userRole.create({
      data: {
        tenant_id: tenantId,
        user_id: userNoPerm.id,
        role_id: roleNoPerm.id,
      },
    });

    // Login
    const loginRes = await request('POST', '/api/v1/auth/tenant/login', {
      email: userNoPerm.email,
      password: 'password123',
    }, undefined, {
      'x-tenant-slug': tenantSlug,
    });
    
    expect(loginRes.status).toBe(200);
    
    // Extract token
    const headers = loginRes.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = typeof headers.getSetCookie === 'function' 
      ? headers.getSetCookie() 
      : [headers.get('set-cookie')];
      
    const tokenCookie = cookies.find(
      (c): c is string => typeof c === 'string' && c.startsWith('tenant_auth_token=')
    );
    let noPermToken = '';
    if (tokenCookie) {
      const cookieValue = tokenCookie.split(';')[0];
      if (cookieValue) {
        const tokenValue = cookieValue.split('=')[1];
        if (tokenValue) {
          noPermToken = decodeURIComponent(tokenValue);
        }
      }
    }

    // Access Dashboard
    const res = await request('GET', '/api/dashboard/executivo', undefined, noPermToken);
    expect(res.status).toBe(403);
  });
});
