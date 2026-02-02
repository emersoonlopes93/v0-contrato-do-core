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
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100/80',
  },
  accepted: {
    label: 'Aceito',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80',
  },
  preparing: {
    label: 'Preparando',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100/80',
  },
  ready: {
    label: 'Pronto',
    className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100/80',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-green-600 text-white border-green-700 hover:bg-green-600/80',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80',
  },
  
  // Estados de pagamento
  pending_payment: {
    label: 'Aguardando Pgto',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80',
  },
  delivering: {
    label: 'Em entrega',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100/80',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-green-700 text-white border-green-800 hover:bg-green-700/80',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-200/80',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const displayLabel = label ?? config.label;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {displayLabel}
    </Badge>
  );
}
