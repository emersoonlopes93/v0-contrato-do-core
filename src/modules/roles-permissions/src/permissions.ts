export const ROLES_PERMISSIONS_PERMISSIONS = {
  VIEW: 'roles-permissions.view',
  MANAGE: 'roles-permissions.manage',
  OPERATE: 'roles-permissions.operate',
} as const;

export type RolesPermissionsPermission =
  (typeof ROLES_PERMISSIONS_PERMISSIONS)[keyof typeof ROLES_PERMISSIONS_PERMISSIONS];
