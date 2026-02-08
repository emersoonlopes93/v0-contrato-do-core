import React from 'react';

export function AdminStoreDesignerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Designer da Loja</h1>
        <p className="text-sm text-muted-foreground">Prepare o visual da loja com dados reais quando disponíveis.</p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sem dados suficientes no momento</h2>
        <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para habilitar o designer.</p>
      </div>
    </div>
  );
}
