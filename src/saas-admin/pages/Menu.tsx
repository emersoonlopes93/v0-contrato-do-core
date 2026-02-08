import React from 'react';

export function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cardápio</h1>
        <p className="text-sm text-muted-foreground">Estrutura pronta para dados reais do cardápio.</p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sem dados suficientes no momento</h2>
        <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para exibir itens do cardápio.</p>
      </div>
    </div>
  );
}
