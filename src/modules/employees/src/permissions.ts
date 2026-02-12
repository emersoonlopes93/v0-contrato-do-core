export const EMPLOYEES_PERMISSIONS = {
  VIEW: 'employees.view',
  MANAGE: 'employees.manage',
  OPERATE: 'employees.operate',
} as const;

export type EmployeesPermission =
  (typeof EMPLOYEES_PERMISSIONS)[keyof typeof EMPLOYEES_PERMISSIONS];
