export const ROLES_PERMISSIONS_EVENTS = {
  ROLE_CREATED: 'roles-permissions.role_created',
  ROLE_UPDATED: 'roles-permissions.role_updated',
  ROLE_DELETED: 'roles-permissions.role_deleted',
  PERMISSION_ASSIGNED: 'roles-permissions.permission_assigned',
  PERMISSION_REMOVED: 'roles-permissions.permission_removed',
} as const;

export type RolesPermissionsEvent =
  (typeof ROLES_PERMISSIONS_EVENTS)[keyof typeof ROLES_PERMISSIONS_EVENTS];
