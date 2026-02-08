import React from 'react';

export function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe pedidos assim que a fonte de dados estiver conectada.</p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sem dados suficientes no momento</h2>
        <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para exibir pedidos.</p>
      </div>
    </div>
  );
}
