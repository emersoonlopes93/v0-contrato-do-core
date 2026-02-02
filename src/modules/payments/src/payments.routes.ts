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
import type { PaymentsProvider, PaymentsServiceContract } from '@/src/types/payments';
import { parsePaymentsCreateRequest } from './payments.service';

function getService(): PaymentsServiceContract | null {
  return globalModuleServiceRegistry.get<PaymentsServiceContract>(
    asModuleId('payments'),
    'PaymentsService',
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

async function handleCreatePayment(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Payments service not found' };
    return;
  }

  const parsed = parsePaymentsCreateRequest(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.createPayment(auth.tenantId, parsed.data);
    res.status = 201;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: error instanceof Error ? error.message : 'Failed to create payment' };
  }
}

async function handleGetPayment(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req, res);
  if (!auth) return;
  const paymentId = req.params?.id;
  if (!paymentId) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing id' };
    return;
  }

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Payments service not found' };
    return;
  }

  try {
    const data = await service.getPaymentById(auth.tenantId, paymentId);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Payment not found' };
      return;
    }
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to get payment' };
  }
}

async function handleWebhook(req: Request, res: Response, provider: PaymentsProvider): Promise<void> {
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Payments service not found' };
    return;
  }
  try {
    await service.handleWebhook(provider, req.headers, req.body);
    res.status = 200;
    res.body = { success: true };
  } catch (error) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: error instanceof Error ? error.message : 'Webhook failed' };
  }
}

export const paymentsRoutes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/payments',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('payments'),
      requirePermission('payments:create'),
    ],
    handler: handleCreatePayment,
  },
  {
    method: 'GET',
    path: '/api/v1/payments/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('payments'),
      requirePermission('payments:create'),
    ],
    handler: handleGetPayment,
  },
  {
    method: 'POST',
    path: '/api/v1/payments/webhook/mercado-pago',
    middlewares: [requestLogger, errorHandler],
    handler: (req, res) => handleWebhook(req, res, 'mercado_pago'),
  },
  {
    method: 'POST',
    path: '/api/v1/payments/webhook/asaas',
    middlewares: [requestLogger, errorHandler],
    handler: (req, res) => handleWebhook(req, res, 'asaas'),
  },
];
