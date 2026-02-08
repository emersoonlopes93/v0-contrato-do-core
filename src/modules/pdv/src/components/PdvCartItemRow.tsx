'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PdvCartItem } from '@/src/types/pdv';

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

type PdvCartItemRowProps = {
  item: PdvCartItem;
  currency: string;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  disabled?: boolean;
};

function PdvCartItemRowComponent({
  item,
  currency,
  onRemove,
  onUpdateQuantity,
  disabled = false,
}: PdvCartItemRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{item.product.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatCurrency(item.product.basePrice, currency)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={String(item.quantity)}
          onChange={(e) => onUpdateQuantity(item.product.id, Number(e.target.value))}
          className="h-9 w-16"
          inputMode="numeric"
          disabled={disabled}
        />
        <Button size="sm" variant="outline" onClick={() => onRemove(item.product.id)} disabled={disabled}>
          Remover
        </Button>
      </div>
    </div>
  );
}

export const PdvCartItemRow = React.memo(PdvCartItemRowComponent);
