/**
 * Hello Module Permissions
 * 
 * Definição centralizada de permissões do módulo
 */

export const PERMISSIONS = {
  HELLO_READ: 'hello.read',
  HELLO_CREATE: 'hello.create',
} as const;

export type HelloPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
