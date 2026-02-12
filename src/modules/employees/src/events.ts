export const EMPLOYEES_EVENTS = {
  CREATED: 'employees.created',
  UPDATED: 'employees.updated',
  DEACTIVATED: 'employees.deactivated',
  ROLE_CHANGED: 'employees.role_changed',
} as const;

export type EmployeesEvent =
  (typeof EMPLOYEES_EVENTS)[keyof typeof EMPLOYEES_EVENTS];
