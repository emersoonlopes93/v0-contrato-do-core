import React from 'react';

export function AdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground">Gerencie integrações quando as APIs estiverem disponíveis.</p>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sem dados suficientes no momento</h2>
        <p className="text-sm text-muted-foreground">Conecte uma fonte de dados para listar integrações.</p>
      </div>
    </div>
  );
}
