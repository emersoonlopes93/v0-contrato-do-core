import {
  errorHandler,
  requireModule,
  requirePermission,
  requireTenantAuth,
  requestLogger,
  type AuthenticatedRequest,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { getPrismaClient } from '@/src/adapters/prisma/client';
import type { EmployeeDTO, EmployeeRole } from '@/src/types/employees';
import { isEmployeeRole } from '@/src/types/employees';
import { hash } from 'bcryptjs';

const prisma = getPrismaClient();

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function getAuth(req: Request, res: Response): { tenantId: string } | null {
  const authReq = req as AuthenticatedRequest;
  const auth = authReq.auth;
  if (!auth || !auth.tenantId) {
    res.status = 401;
    res.body = { error: 'Unauthorized', message: 'Authentication context is missing' };
    return null;
  }
  return { tenantId: auth.tenantId };
}

function toEmployeeDTO(row: {
  id: string;
  tenant_id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  userRoles: Array<{ role: { slug: string } }>;
}): EmployeeDTO {
  const role = row.userRoles[0]?.role.slug;
  const roleSlug = typeof role === 'string' ? role : '';
  const safeRole: EmployeeRole = isEmployeeRole(roleSlug) ? roleSlug : 'balconista';
  const active = row.status === 'active';

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name ?? row.email,
    email: row.email,
    role: safeRole,
    active,
    status: active ? 'active' : 'inactive',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function ensureRole(tenantId: string, role: EmployeeRole): Promise<{ id: string }> {
  const existing = await prisma.role.findUnique({
    where: {
      tenant_id_slug: {
        tenant_id: tenantId,
        slug: role,
      },
    },
    select: { id: true },
  });

  if (existing) return existing;

  const created = await prisma.role.create({
    data: {
      tenant_id: tenantId,
      name: role,
      slug: role,
      description: role,
    },
    select: { id: true },
  });

  return created;
}

async function handleList(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const rows = await prisma.tenantUser.findMany({
    where: {
      tenant_id: auth.tenantId,
      status: { in: ['active', 'inactive'] },
    },
    include: {
      userRoles: {
        include: {
          role: { select: { slug: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  res.status = 200;
  res.body = {
    success: true,
    data: rows.map(toEmployeeDTO),
  };
}

async function handleCreate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  if (!isRecord(req.body)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  if (!isString(name) || name.trim().length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'name é obrigatório' };
    return;
  }

  if (!isString(email) || email.trim().length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'email é obrigatório' };
    return;
  }

  if (!isString(password) || password.trim().length < 6) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'password deve ter ao menos 6 caracteres' };
    return;
  }

  if (!isString(role) || !isEmployeeRole(role)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'role inválido' };
    return;
  }

  const roleRow = await ensureRole(auth.tenantId, role);
  const passwordHash = await hash(password, 10);

  const created = await prisma.tenantUser.create({
    data: {
      tenant_id: auth.tenantId,
      email,
      password_hash: passwordHash,
      name,
      status: 'active',
      userRoles: {
        create: {
          tenant_id: auth.tenantId,
          role_id: roleRow.id,
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: { select: { slug: true } },
        },
      },
    },
  });

  res.status = 201;
  res.body = {
    success: true,
    data: toEmployeeDTO(created),
  };
}

async function handleUpdate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'id é obrigatório' };
    return;
  }

  if (!isRecord(req.body)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const name = req.body.name;
  const email = req.body.email;
  const role = req.body.role;
  const active = req.body.active;

  if (name !== undefined && (!isString(name) || name.trim().length === 0)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'name inválido' };
    return;
  }

  if (email !== undefined && (!isString(email) || email.trim().length === 0)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'email inválido' };
    return;
  }

  if (role !== undefined && (!isString(role) || !isEmployeeRole(role))) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'role inválido' };
    return;
  }

  if (active !== undefined && typeof active !== 'boolean') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'active inválido' };
    return;
  }

  const existing = await prisma.tenantUser.findFirst({
    where: { id, tenant_id: auth.tenantId },
    include: {
      userRoles: {
        include: {
          role: { select: { slug: true } },
        },
      },
    },
  });

  if (!existing) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Funcionário não encontrado' };
    return;
  }

  const nextStatus = active === undefined ? undefined : active ? 'active' : 'inactive';

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.tenantUser.update({
      where: { id: existing.id },
      data: {
        name: name === undefined ? undefined : name,
        email: email === undefined ? undefined : email,
        status: nextStatus === undefined ? undefined : nextStatus,
      },
      include: {
        userRoles: {
          include: {
            role: { select: { slug: true } },
          },
        },
      },
    });

    if (role !== undefined) {
      const roleRow = await ensureRole(auth.tenantId, role);
      await tx.userRole.deleteMany({
        where: { user_id: user.id, tenant_id: auth.tenantId },
      });
      await tx.userRole.create({
        data: {
          user_id: user.id,
          tenant_id: auth.tenantId,
          role_id: roleRow.id,
        },
      });

      const reloaded = await tx.tenantUser.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: { select: { slug: true } },
            },
          },
        },
      });

      if (!reloaded) return user;
      return reloaded;
    }

    return user;
  });

  res.status = 200;
  res.body = {
    success: true,
    data: toEmployeeDTO(updated),
  };
}

async function handleDeactivate(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'id é obrigatório' };
    return;
  }

  const existing = await prisma.tenantUser.findFirst({
    where: { id, tenant_id: auth.tenantId },
    select: { id: true },
  });

  if (!existing) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Funcionário não encontrado' };
    return;
  }

  await prisma.tenantUser.update({
    where: { id: existing.id },
    data: { status: 'inactive' },
  });

  res.status = 204;
  res.body = { success: true, data: null };
}

export const employeesTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/employees',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('employees'),
      requirePermission('employees.view'),
    ],
    handler: handleList,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/employees',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('employees'),
      requirePermission('employees.manage'),
    ],
    handler: handleCreate,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/employees/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('employees'),
      requirePermission('employees.manage'),
    ],
    handler: handleUpdate,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/employees/:id/deactivate',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('employees'),
      requirePermission('employees.manage'),
    ],
    handler: handleDeactivate,
  },
];
