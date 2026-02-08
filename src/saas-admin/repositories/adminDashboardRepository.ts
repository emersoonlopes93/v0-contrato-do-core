import { adminApi } from '@/src/saas-admin/lib/adminApi';
import type { SaaSAdminDashboardMetricsDTO } from '@/src/types/saas-admin';

export async function fetchAdminDashboardMetrics(): Promise<SaaSAdminDashboardMetricsDTO> {
  return adminApi.get<SaaSAdminDashboardMetricsDTO>('/dashboard');
}
