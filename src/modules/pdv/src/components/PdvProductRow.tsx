'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { MenuOnlineProductDTO } from '@/src/types/menu-online';

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

type PdvProductRowProps = {
  product: MenuOnlineProductDTO;
  onAdd: (product: MenuOnlineProductDTO) => void;
  currency: string;
  disabled?: boolean;
};

function PdvProductRowComponent({ product, onAdd, currency, disabled = false }: PdvProductRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">{product.name}</div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(product.basePrice, currency)}
        </div>
      </div>
      <Button size="sm" onClick={() => onAdd(product)} disabled={disabled}>
        Adicionar
      </Button>
    </div>
  );
}

export const PdvProductRow = React.memo(PdvProductRowComponent);
