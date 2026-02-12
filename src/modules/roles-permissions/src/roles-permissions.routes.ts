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
import type { Permission, Role, RoleDTO, RolePermissionDTO } from '@/src/types/roles-permissions';
import { isRole } from '@/src/types/roles-permissions';

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

const DEFAULT_ROLES: Role[] = ['admin', 'gerente', 'cozinha', 'balconista', 'garcom'];

async function ensureDefaultRoles(tenantId: string): Promise<void> {
  for (const slug of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: {
        tenant_id_slug: {
          tenant_id: tenantId,
          slug,
        },
      },
      update: {
        name: slug,
        description: slug,
      },
      create: {
        tenant_id: tenantId,
        name: slug,
        slug,
        description: slug,
      },
    });
  }
}

function toRolePermissionDTO(row: {
  id: string;
  role: { slug: string };
  permission: { slug: string };
  role_id: string;
}): RolePermissionDTO | null {
  const roleSlug = row.role.slug;
  if (!isRole(roleSlug)) return null;

  const permissionSlug = row.permission.slug;
  const dotIndex = permissionSlug.lastIndexOf('.');
  if (dotIndex <= 0) return null;

  const moduleId = permissionSlug.slice(0, dotIndex);
  const perm = permissionSlug.slice(dotIndex + 1);

  const permission: Permission = perm === 'view' || perm === 'manage' || perm === 'operate' ? perm : 'view';

  return {
    id: row.id,
    tenantId: '',
    role: roleSlug,
    moduleId,
    permission,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function listRolePermissions(tenantId: string, roleId: string): Promise<RolePermissionDTO[]> {
  const rows = await prisma.rolePermission.findMany({
    where: {
      role_id: roleId,
      role: { tenant_id: tenantId },
    },
    include: {
      role: { select: { slug: true } },
      permission: { select: { slug: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const out: RolePermissionDTO[] = [];
  for (const row of rows) {
    const dto = toRolePermissionDTO({
      id: row.id,
      role: row.role,
      permission: row.permission,
      role_id: row.role_id,
    });
    if (dto) {
      out.push({
        ...dto,
        tenantId,
      });
    }
  }
  return out;
}

async function handleListRoles(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  await ensureDefaultRoles(auth.tenantId);

  const roles = await prisma.role.findMany({
    where: {
      tenant_id: auth.tenantId,
      slug: { in: DEFAULT_ROLES },
    },
    orderBy: { slug: 'asc' },
    select: {
      id: true,
      tenant_id: true,
      slug: true,
      description: true,
      created_at: true,
      updated_at: true,
    },
  });

  const data: RoleDTO[] = [];
  for (const r of roles) {
    if (!isRole(r.slug)) continue;
    const permissions = await listRolePermissions(auth.tenantId, r.id);
    data.push({
      id: r.id,
      tenantId: r.tenant_id,
      name: r.slug,
      description: r.description,
      permissions,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    });
  }

  res.status = 200;
  res.body = { success: true, data };
}

async function ensurePermissionRow(moduleIdOrSlug: string, permissionSlug: string): Promise<{ id: string } | null> {
  const moduleRecord = await prisma.module.findFirst({
    where: {
      OR: [{ id: moduleIdOrSlug }, { slug: moduleIdOrSlug }],
    },
    select: { id: true, permissions: true },
  });

  if (!moduleRecord) return null;

  const existing = await prisma.permission.findUnique({
    where: {
      module_id_slug: {
        module_id: moduleRecord.id,
        slug: permissionSlug,
      },
    },
    select: { id: true },
  });

  if (existing) return existing;

  await prisma.permission.create({
    data: {
      module_id: moduleRecord.id,
      slug: permissionSlug,
      name: permissionSlug,
      description: permissionSlug,
    },
    select: { id: true },
  });

  const created = await prisma.permission.findUnique({
    where: {
      module_id_slug: {
        module_id: moduleRecord.id,
        slug: permissionSlug,
      },
    },
    select: { id: true },
  });

  return created ?? null;
}

async function handleAssign(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  if (!isRecord(req.body)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const roleId = req.body.roleId;
  const moduleId = req.body.moduleId;
  const permission = req.body.permission;

  if (!isString(roleId) || roleId.length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'roleId é obrigatório' };
    return;
  }

  if (!isString(moduleId) || moduleId.length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'moduleId é obrigatório' };
    return;
  }

  if (permission !== 'view' && permission !== 'manage' && permission !== 'operate') {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'permission inválida' };
    return;
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, tenant_id: auth.tenantId },
    select: { id: true },
  });

  if (!role) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Role não encontrado' };
    return;
  }

  const permissionSlug = `${moduleId}.${permission}`;
  const permRow = await ensurePermissionRow(moduleId, permissionSlug);
  if (!permRow) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Módulo não encontrado' };
    return;
  }

  const created = await prisma.rolePermission.upsert({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permRow.id,
      },
    },
    update: {},
    create: {
      role_id: roleId,
      permission_id: permRow.id,
    },
    select: { id: true },
  });

  res.status = 201;
  res.body = { success: true, data: { id: created.id } };
}

async function handleRemove(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  if (!isRecord(req.body)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const roleId = req.body.roleId;
  const moduleId = req.body.moduleId;

  if (!isString(roleId) || roleId.length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'roleId é obrigatório' };
    return;
  }

  if (!isString(moduleId) || moduleId.length === 0) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'moduleId é obrigatório' };
    return;
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, tenant_id: auth.tenantId },
    select: { id: true },
  });

  if (!role) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Role não encontrado' };
    return;
  }

  const permissions = await prisma.permission.findMany({
    where: {
      OR: [
        { slug: `${moduleId}.view` },
        { slug: `${moduleId}.manage` },
        { slug: `${moduleId}.operate` },
      ],
      module: { OR: [{ id: moduleId }, { slug: moduleId }] },
    },
    select: { id: true },
  });

  if (permissions.length === 0) {
    res.status = 204;
    res.body = { success: true, data: null };
    return;
  }

  await prisma.rolePermission.deleteMany({
    where: {
      role_id: roleId,
      permission_id: { in: permissions.map((p) => p.id) },
    },
  });

  res.status = 204;
  res.body = { success: true, data: null };
}

export const rolesPermissionsTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/roles-permissions/roles',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('roles-permissions'),
      requirePermission('roles-permissions.view'),
    ],
    handler: handleListRoles,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/roles-permissions/assign',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('roles-permissions'),
      requirePermission('roles-permissions.manage'),
    ],
    handler: handleAssign,
  },
  {
    method: 'POST',
    path: '/api/v1/tenant/roles-permissions/remove',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('roles-permissions'),
      requirePermission('roles-permissions.manage'),
    ],
    handler: handleRemove,
  },
];
