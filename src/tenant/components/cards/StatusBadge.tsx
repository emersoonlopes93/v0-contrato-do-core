'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * StatusBadge - Badge colorido por status de pedido
 * 
 * Cores padronizadas conforme especificação do prompt oficial:
 * - pending_payment → amarelo
 * - confirmed → verde
 * - preparing → azul
 * - ready → roxo
 * - delivering → laranja
 * - delivered → verde escuro
 * - canceled → vermelho
 * - expired → cinza
 * 
 * Uso:
 * <StatusBadge status="confirmed" />
 * <StatusBadge status="preparing" label="Em preparo" />
 */

type OrderStatus =
  | 'created'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'pending_payment'
  | 'confirmed'
  | 'delivering'
  | 'delivered'
  | 'expired';

type StatusBadgeProps = {
  status: OrderStatus | string;
  label?: string;
  className?: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Estados do Kanban
  created: {
    label: 'Criado',
    className: 'bg-muted text-muted-foreground border-border-soft',
  },
  accepted: {
    label: 'Aceito',
    className: 'bg-success-soft text-success border-success/20',
  },
  preparing: {
    label: 'Preparando',
    className: 'bg-info-soft text-info border-info/20',
  },
  ready: {
    label: 'Pronto',
    className: 'bg-info-soft text-info border-info/20',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-success text-success-foreground border-success/30',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-danger-soft text-danger border-danger/20',
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-danger-soft text-danger border-danger/20',
  },
  
  // Estados de pagamento
  pending_payment: {
    label: 'Aguardando Pgto',
    className: 'bg-warning-soft text-warning border-warning/20',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-success-soft text-success border-success/20',
  },
  delivering: {
    label: 'Em entrega',
    className: 'bg-info-soft text-info border-info/20',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-success text-success-foreground border-success/30',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-muted text-muted-foreground border-border-soft',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border-soft',
  };

  const displayLabel = label ?? config.label;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {displayLabel}
    </Badge>
  );
}
