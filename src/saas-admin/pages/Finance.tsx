import React from 'react';

export function AdminFinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Acompanhe dados financeiros quando a API estiver conectada.</p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sem dados suficientes no momento</h2>
        <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para exibir dados financeiros.</p>
      </div>
    </div>
  );
}
