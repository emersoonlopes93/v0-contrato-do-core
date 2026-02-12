export const CUSTOMERS_CRM_PERMISSIONS = {
  VIEW: 'customers-crm.view',
  MANAGE: 'customers-crm.manage',
  OPERATE: 'customers-crm.operate',
} as const;

export type CustomersCrmPermission =
  (typeof CUSTOMERS_CRM_PERMISSIONS)[keyof typeof CUSTOMERS_CRM_PERMISSIONS];
