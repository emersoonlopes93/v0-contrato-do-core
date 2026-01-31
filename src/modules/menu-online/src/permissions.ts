export const MENU_ONLINE_PERMISSIONS = {
  MENU_VIEW: 'menu.view',
  MENU_MANAGE: 'menu.manage',
  CATEGORIES_MANAGE: 'categories.manage',
  PRODUCTS_MANAGE: 'products.manage',
  MODIFIERS_MANAGE: 'modifiers.manage',
  PRICING_MANAGE: 'pricing.manage',
} as const;

export type MenuOnlinePermission =
  (typeof MENU_ONLINE_PERMISSIONS)[keyof typeof MENU_ONLINE_PERMISSIONS];
