'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/src/tenant/components/cards';
import { ORDERS_OPERATIONAL_STATUS, ORDERS_STATUS_LABELS } from '@/src/types/orders';
import type { OrdersOrderSummaryDTO } from '@/src/types/orders';

type KdsOrderCardProps = {
  order: OrdersOrderSummaryDTO;
  onUpdateStatus: (orderId: string, status: string) => void;
  isUpdating?: boolean;
  highlight?: boolean;
};

function KdsOrderCardComponent({
  order,
  onUpdateStatus,
  isUpdating = false,
  highlight = false,
}: KdsOrderCardProps) {
  const confirmStatusChange = (nextStatus: string) => {
    const label = ORDERS_STATUS_LABELS[nextStatus] ?? nextStatus;
    if (!window.confirm(`Confirmar atualização para ${label}?`)) return;
    onUpdateStatus(order.id, nextStatus);
  };

  return (
    <Card
      className={`border border-border/60 transition-all ${highlight ? 'ring-2 ring-primary/40 shadow-md' : ''}`}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-xs text-muted-foreground">{order.itemsCount} item(ns)</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {order.status === ORDERS_OPERATIONAL_STATUS.NEW && (
            <Button size="sm" onClick={() => confirmStatusChange(ORDERS_OPERATIONAL_STATUS.ACCEPTED)} disabled={isUpdating}>
              Aceitar
            </Button>
          )}
          {(order.status === ORDERS_OPERATIONAL_STATUS.NEW ||
            order.status === ORDERS_OPERATIONAL_STATUS.ACCEPTED) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => confirmStatusChange(ORDERS_OPERATIONAL_STATUS.PREPARING)}
              disabled={isUpdating}
            >
              Em preparo
            </Button>
          )}
          {order.status === ORDERS_OPERATIONAL_STATUS.PREPARING && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => confirmStatusChange(ORDERS_OPERATIONAL_STATUS.READY)}
              disabled={isUpdating}
            >
              Pronto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const KdsOrderCard = React.memo(KdsOrderCardComponent);
