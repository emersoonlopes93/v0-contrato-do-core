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
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import type {
  CustomersCrmServiceContract,
  CustomersCrmUpdateCustomerRequest,
} from '@/src/types/customers-crm';

function getService(): CustomersCrmServiceContract | null {
  return globalModuleServiceRegistry.get<CustomersCrmServiceContract>(
    asModuleId('customers-crm'),
    'CustomersCrmService',
  );
}

import { isRecord } from '@/src/core/utils/type-guards';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isStatus(value: unknown): value is CustomersCrmUpdateCustomerRequest['status'] {
  return value === 'normal' || value === 'vip' || value === 'bloqueado' || value === 'inativo';
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

async function handleList(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const pageRaw = req.query?.page;
  const pageSizeRaw = req.query?.pageSize;
  const segment = req.query?.segment ?? null;
  const search = req.query?.search ?? null;

  const page = typeof pageRaw === 'string' ? Number(pageRaw) : 1;
  const pageSize = typeof pageSizeRaw === 'string' ? Number(pageSizeRaw) : 20;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'CRM service não registrado' };
    return;
  }

  const data = await service.listCustomers({
    tenantId: auth.tenantId,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    segment,
    search,
  });

  res.status = 200;
  res.body = { success: true, data };
}

async function handleGet(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'id é obrigatório' };
    return;
  }

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'CRM service não registrado' };
    return;
  }

  const data = await service.getCustomerDetails({ tenantId: auth.tenantId, customerId: id });
  if (!data) {
    res.status = 404;
    res.body = { error: 'Not Found', message: 'Cliente não encontrado' };
    return;
  }

  res.status = 200;
  res.body = { success: true, data };
}

function parseUpdateBody(value: unknown): CustomersCrmUpdateCustomerRequest | null {
  if (!isRecord(value)) return null;

  const out: CustomersCrmUpdateCustomerRequest = {};

  if ('notes' in value) {
    const notes = value.notes;
    if (notes !== undefined && !isNullableString(notes)) return null;
    out.notes = notes as string | null | undefined;
  }

  if ('status' in value) {
    const status = value.status;
    if (status !== undefined && !isStatus(status)) return null;
    out.status = status as CustomersCrmUpdateCustomerRequest['status'] | undefined;
  }

  if ('name' in value) {
    const name = value.name;
    if (name !== undefined && (!isString(name) || name.trim().length === 0)) return null;
    out.name = name as string | undefined;
  }

  if ('phone' in value) {
    const phone = value.phone;
    if (phone !== undefined && !isNullableString(phone)) return null;
    out.phone = phone as string | null | undefined;
  }

  if ('email' in value) {
    const email = value.email;
    if (email !== undefined && !isNullableString(email)) return null;
    out.email = email as string | null | undefined;
  }

  return out;
}

async function handlePatch(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'id é obrigatório' };
    return;
  }

  const input = parseUpdateBody(req.body);
  if (!input) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Body inválido' };
    return;
  }

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'CRM service não registrado' };
    return;
  }

  const data = await service.updateCustomer({ tenantId: auth.tenantId, customerId: id, input });

  res.status = 200;
  res.body = { success: true, data };
}

async function handleOverview(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'CRM service não registrado' };
    return;
  }

  const data = await service.getOverviewMetrics({ tenantId: auth.tenantId });

  res.status = 200;
  res.body = { success: true, data };
}

export const customersCrmRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/crm/customers',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('customers-crm'),
      requirePermission('customers-crm.view'),
    ],
    handler: handleList,
  },
  {
    method: 'GET',
    path: '/api/v1/crm/customers/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('customers-crm'),
      requirePermission('customers-crm.view'),
    ],
    handler: handleGet,
  },
  {
    method: 'PATCH',
    path: '/api/v1/crm/customers/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('customers-crm'),
      requirePermission('customers-crm.manage'),
    ],
    handler: handlePatch,
  },
  {
    method: 'GET',
    path: '/api/v1/crm/metrics/overview',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('customers-crm'),
      requirePermission('customers-crm.view'),
    ],
    handler: handleOverview,
  },
];
