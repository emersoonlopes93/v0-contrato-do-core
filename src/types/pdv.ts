import type { MenuOnlineProductDTO } from '@/src/types/menu-online';

export type PdvCartItem = {
  product: MenuOnlineProductDTO;
  quantity: number;
};

export type PdvSummary = {
  subtotal: number;
  total: number;
};
