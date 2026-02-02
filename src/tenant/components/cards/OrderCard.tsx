'use client';

import React from 'react';
import { BaseCard } from './BaseCard';
import { StatusBadge } from './StatusBadge';
import { Clock, CreditCard, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * OrderCard - Card padronizado para pedidos
 * 
 * Estrutura:
 * - Header: Número do pedido + status badge
 * - Body: Cliente, valor, itens
 * - Footer: Hora, método de pagamento, tipo de entrega
 * 
 * Variantes:
 * - compact: versão para Kanban
 * - full: versão para lista
 * 
 * Uso:
 * <OrderCard
 *   variant="full"
 *   orderNumber={123}
 *   status="preparing"
 *   customerName="João Silva"
 *   total={45.90}
 *   itemsCount={3}
 *   createdAt="2024-01-20T10:30:00Z"
 *   paymentMethod="pix"
 *   deliveryType="delivery"
 *   onClick={() => {}}
 * />
 */

type OrderCardProps = {
  variant?: 'compact' | 'full';
  orderNumber: number;
  status: string;
  customerName?: string | null;
  total: number;
  itemsCount: number;
  createdAt: string;
  paymentMethod?: string | null;
  deliveryType?: string | null;
  source?: string;
  currency?: string;
  timezone?: string | null;
  onClick?: () => void;
  className?: string;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão',
  debit_card: 'Débito',
  cash: 'Dinheiro',
  voucher: 'Vale',
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  delivery: 'Entrega',
  pickup: 'Retirada',
  dine_in: 'Mesa',
};

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function formatTime(value: string, timezone: string | null): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone ?? undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export function OrderCard({
  variant = 'full',
  orderNumber,
  status,
  customerName,
  total,
  itemsCount,
  createdAt,
  paymentMethod,
  deliveryType,
  source,
  currency = 'BRL',
  timezone = null,
  onClick,
  className,
}: OrderCardProps) {
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <BaseCard onClick={onClick} className={cn('hover:border-primary/50', className)}>
        <BaseCard.Header
          title={
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold">#{orderNumber}</span>
              <StatusBadge status={status} />
            </div>
          }
          description={source && <span className="text-xs text-muted-foreground">{source}</span>}
        />
        <BaseCard.Content className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{itemsCount} item(ns)</span>
            <span className="font-semibold text-foreground">{formatCurrency(total, currency)}</span>
          </div>
          {customerName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{customerName}</span>
            </div>
          )}
        </BaseCard.Content>
      </BaseCard>
    );
  }

  return (
    <BaseCard onClick={onClick} className={cn('hover:border-primary/50', className)}>
      <BaseCard.Header
        title={
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">#{orderNumber}</span>
            <StatusBadge status={status} />
          </div>
        }
        description={
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {source && <span>{source}</span>}
            {deliveryType && (
              <>
                <span>•</span>
                <span>{DELIVERY_TYPE_LABELS[deliveryType] ?? deliveryType}</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(createdAt, timezone)}
            </span>
          </div>
        }
      />
      <BaseCard.Content>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {customerName && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="truncate">{customerName}</span>
              </div>
            )}
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>{itemsCount} item(ns)</span>
            </div>
          </div>
          <div className="text-xl font-bold text-foreground">{formatCurrency(total, currency)}</div>
        </div>
      </BaseCard.Content>
      {paymentMethod && (
        <BaseCard.Footer className="border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            <span>{PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}</span>
          </div>
        </BaseCard.Footer>
      )}
    </BaseCard>
  );
}
