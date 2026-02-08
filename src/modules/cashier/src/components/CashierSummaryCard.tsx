'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CashierSummaryCardProps = {
  totalOrders: number;
  totalAmount: string;
  hasSession: boolean;
};

export function CashierSummaryCard({ totalOrders, totalAmount, hasSession }: CashierSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos vinculados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasSession ? (
          <div className="text-sm text-muted-foreground">Abra o caixa para vincular pedidos.</div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pedidos</span>
              <span>{totalOrders}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{totalAmount}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
