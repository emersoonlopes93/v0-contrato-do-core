export const DASHBOARD_EXECUTIVO_PERMISSIONS = {
  VIEW: 'dashboard-executivo.view',
} as const;

export type DashboardExecutivoPermission = (typeof DASHBOARD_EXECUTIVO_PERMISSIONS)[keyof typeof DASHBOARD_EXECUTIVO_PERMISSIONS];
