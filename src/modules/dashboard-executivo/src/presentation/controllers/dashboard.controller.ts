import {
  type AuthenticatedRequest,
  type Request,
  type Response,
} from '@/src/api/v1/middleware';
import { DashboardService } from '../../application/services/dashboard.service';
import { PrismaDashboardRepository } from '../../infrastructure/repositories/prisma-dashboard.repository';

// Instanciar o serviço (em um container real seria injetado)
const dashboardRepository = new PrismaDashboardRepository();
const dashboardService = new DashboardService(dashboardRepository);

export async function handleGetExecutiveDashboard(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const tenantId = authReq.auth?.tenantId;

  if (!tenantId) {
    res.status = 400;
    res.body = { error: 'Tenant ID is required' };
    return;
  }

  try {
    const { period, start, end } = req.query || {};

    // Validar e tipar o period
    let validPeriod: '7d' | '30d' | 'custom' | undefined;
    if (period === '7d' || period === '30d' || period === 'custom') {
      validPeriod = period;
    }

    const dashboardData = await dashboardService.getExecutiveDashboard(tenantId, {
      period: validPeriod,
      start: start,
      end: end,
    });

    res.status = 200;
    res.body = dashboardData;
  } catch (error) {
    console.error('Error getting executive dashboard:', error);
    res.status = 500;
    res.body = { error: 'Internal Server Error' };
  }
}
