export interface ExecutiveDashboardDTO {
  receita: {
    hoje: number;
    ultimos7dias: number;
    ultimos30dias: number;
    crescimentoPercentual: number;
  };
  pedidos: {
    hoje: number;
    ultimos7dias: number;
    ultimos30dias: number;
  };
  ticketMedio: {
    hoje: number;
    ultimos30dias: number;
  };
  clientesAtivos30d: number;
  taxaRecompra: number;
  topClientes: Array<{
    id: string;
    nome: string;
    totalGasto: number;
    totalPedidos: number;
    scoreRFM?: number;
  }>;
  performanceEntrega: {
    tempoMedioReal: number;
    diferencaPrevistoReal: number;
  } | null;
}

export interface DashboardDateRange {
  start: Date;
  end: Date;
}
