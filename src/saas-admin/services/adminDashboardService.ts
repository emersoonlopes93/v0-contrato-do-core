import { fetchAdminDashboardMetrics } from '@/src/saas-admin/repositories/adminDashboardRepository';
import type { SaaSAdminDashboardMetricsDTO } from '@/src/types/saas-admin';

export async function getAdminDashboardMetrics(): Promise<SaaSAdminDashboardMetricsDTO> {
  return fetchAdminDashboardMetrics();
}
