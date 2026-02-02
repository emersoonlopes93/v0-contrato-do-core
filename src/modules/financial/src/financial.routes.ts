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
import type { FinancialServiceContract } from '@/src/types/financial';
import { FINANCIAL_PERMISSIONS } from './permissions';

function getService(): FinancialServiceContract | null {
  return globalModuleServiceRegistry.get<FinancialServiceContract>(
    asModuleId('financial'),
    'FinancialService',
  );
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

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function handleGetSummary(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Financial service not found' };
    return;
  }

  try {
    const data = await service.getSummary(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load summary' };
  }
}

async function handleListOrders(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Financial service not found' };
    return;
  }

  const page = parsePositiveInt(req.query?.page, 1);
  const pageSizeRaw = parsePositiveInt(req.query?.pageSize, 20);
  const pageSize = Math.min(100, pageSizeRaw);

  try {
    const data = await service.listPaidOrders({ tenantId: auth.tenantId, page, pageSize });
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to load orders' };
  }
}

export const financialRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/financial/summary',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('financial'),
      requirePermission(FINANCIAL_PERMISSIONS.FINANCIAL_SUMMARY_READ),
    ],
    handler: handleGetSummary,
  },
  {
    method: 'GET',
    path: '/api/v1/financial/orders',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('financial'),
      requirePermission(FINANCIAL_PERMISSIONS.FINANCIAL_ORDERS_READ),
    ],
    handler: handleListOrders,
  },
];

