import type { StrategicInsight, StrategicInsightsInput, ImpactLevel } from '@/src/modules/dashboard-executivo/src/types/insights';

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function currencyBR(amount: number): string {
  const v = Math.round(amount);
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function impactByDeltaRevenue(delta: number, orders: number): string {
  const lift = delta * orders;
  return `${currencyBR(lift)} de incremento potencial de receita`;
}

function impactByMarginRecovery(revenue: number, ppoints: number): string {
  const lift = (revenue * ppoints) / 100;
  return `${currencyBR(lift)} de potencial aumento de lucro`;
}

function levelFromScore(score: number): ImpactLevel {
  if (score >= 0.75) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.25) return 'medium';
  return 'low';
}

export function generateStrategicInsights(input: StrategicInsightsInput): StrategicInsight[] {
  const insights: StrategicInsight[] = [];

  const marginGap = input.benchmarkComparison.profitMargin - input.profitMargin;
  const marginDrop = input.historicalComparison.profitMarginChange;
  const marginPressureScore = clamp((marginGap > 0 ? marginGap : 0) / 10 + (marginDrop < 0 ? Math.abs(marginDrop) / 10 : 0), 0, 1);
  if (marginPressureScore >= 0.25) {
    const ppoints = clamp(Math.round(Math.max(marginGap, Math.abs(marginDrop))), 1, 8);
    insights.push({
      type: 'financial',
      title: 'Margem pressionada por mix e custos',
      diagnosis: 'Margem abaixo do benchmark e tendência negativa indicam pressão por custos variáveis e mix de produto pouco rentável.',
      impactLevel: levelFromScore(marginPressureScore),
      estimatedImpact: impactByMarginRecovery(input.revenue, ppoints),
      recommendedAction: 'Revisar precificação e bundles em itens de alta demanda, reduzir custos logísticos e renegociar insumos; ajustar participação de itens de baixa margem.',
      priority: marginPressureScore >= 0.75 ? 1 : marginPressureScore >= 0.5 ? 2 : 3,
      strategicCategory: 'Revenue',
    });
  }

  const ticketGap = input.benchmarkComparison.ticketAverage - input.ticketAverage;
  const ticketUnderScore = clamp((ticketGap > 0 ? ticketGap : 0) / (input.benchmarkComparison.ticketAverage || 1), 0, 1);
  if (ticketUnderScore >= 0.1) {
    const delta = Math.max(ticketGap, input.ticketAverage * 0.05);
    insights.push({
      type: 'growth',
      title: 'Ticket médio abaixo do mercado',
      diagnosis: 'Ticket médio inferior sugere excesso de descontos ou mix pouco atrativo, reduzindo monetização por pedido.',
      impactLevel: levelFromScore(ticketUnderScore),
      estimatedImpact: impactByDeltaRevenue(delta, input.orders),
      recommendedAction: 'Implementar upsell com combos e complementos nos horários de pico, criar bundles com margem positiva e ajustar descontos por canal.',
      priority: ticketUnderScore >= 0.75 ? 1 : ticketUnderScore >= 0.5 ? 2 : 3,
      strategicCategory: 'Revenue',
    });
  }

  const delayGap = input.deliveryDelay.avg - input.benchmarkComparison.deliveryDelayAvg;
  const delayScore = clamp((delayGap > 0 ? delayGap : 0) / Math.max(input.benchmarkComparison.deliveryDelayAvg, 1), 0, 1);
  const severeDelay = input.deliveryDelay.p95 >= 60;
  if (delayScore >= 0.15 || severeDelay) {
    const cancelGap = input.cancellationRate - input.benchmarkComparison.cancellationRate;
    const atRisk = Math.max(cancelGap, 0) * input.orders * input.ticketAverage;
    insights.push({
      type: 'operational',
      title: 'Atrasos de entrega elevam risco de cancelamento',
      diagnosis: 'Tempo médio e p95 acima do esperado indicam gargalo operacional e roteirização ineficiente, afetando experiência e churn.',
      impactLevel: levelFromScore(severeDelay ? 0.8 : delayScore),
      estimatedImpact: `${currencyBR(Math.max(atRisk, input.orders * 0.02 * input.ticketAverage))} em risco por cancelamentos e perda de recorrência`,
      recommendedAction: 'Rebalancear filas, reduzir tempos de preparação de itens críticos, ajustar janelas de promessa, otimizar rotas e priorizar pedidos VIP.',
      priority: severeDelay ? 1 : delayScore >= 0.5 ? 2 : 3,
      strategicCategory: 'Operations',
    });
  }

  const repeatGap = input.benchmarkComparison.repeatCustomerRate - input.repeatCustomerRate;
  const repeatScore = clamp((repeatGap > 0 ? repeatGap : 0), 0, 1);
  if (repeatScore >= 0.05) {
    const liftOrders = Math.round(input.orders * Math.min(repeatScore, 0.2));
    const liftRevenue = liftOrders * input.ticketAverage;
    insights.push({
      type: 'retention',
      title: 'Baixa recompra reduz LTV',
      diagnosis: 'Taxa de clientes recorrentes abaixo do benchmark sugere falta de jornada de fidelização e benefícios ao cliente.',
      impactLevel: levelFromScore(repeatScore),
      estimatedImpact: `${currencyBR(liftRevenue)} de receita adicional com aumento de recompra`,
      recommendedAction: 'Ativar campanhas de fidelidade com tiers, cupons pós-entrega e benefícios vinculados a frequência; segmentar VIP e recorrentes.',
      priority: repeatScore >= 0.5 ? 2 : 3,
      strategicCategory: 'Retention',
    });
  }

  const churnGap = input.churnRate - input.benchmarkComparison.churnRate;
  const churnScore = clamp((churnGap > 0 ? churnGap : 0), 0, 1);
  const churnAlert = input.alerts.some(a => a.type === 'churn' && (a.severity === 'high' || a.severity === 'critical'));
  if (churnScore >= 0.05 || churnAlert) {
    const recoverable = Math.round(input.orders * Math.max(churnScore, 0.05)) * input.ticketAverage;
    insights.push({
      type: 'risk',
      title: 'Risco de churn exige ação imediata',
      diagnosis: 'Elevação da taxa de churn acima do benchmark indica deterioração de experiência e valor percebido.',
      impactLevel: levelFromScore(churnAlert ? 0.8 : churnScore),
      estimatedImpact: `${currencyBR(recoverable)} preserváveis via win-back e melhorias de serviço`,
      recommendedAction: 'Implementar sequência de win-back multi-canal, oferecer incentivos pontuais e corrigir causas raiz em tempos de entrega e qualidade.',
      priority: 1,
      strategicCategory: 'Retention',
    });
  }

  const roas = input.marketingPerformance.roas;
  const cac = input.marketingPerformance.cac;
  const marketingScore = clamp(((roas < 2 ? (2 - roas) / 2 : 0) + (cac > input.ticketAverage * 0.3 ? 0.5 : 0)), 0, 1);
  if (marketingScore >= 0.25) {
    insights.push({
      type: 'financial',
      title: 'Aquisição ineficiente reduz retorno de marketing',
      diagnosis: 'ROAS baixo e CAC elevado indicam alocação subótima entre canais e criativos com baixo desempenho.',
      impactLevel: levelFromScore(marketingScore),
      estimatedImpact: `${currencyBR(Math.round(input.revenue * 0.03))} de ganho ao redistribuir orçamento para canais com melhor ROAS`,
      recommendedAction: 'Rebalancear orçamento para canais com ROAS superior, pausar criativos abaixo de meta, otimizar landing e funil para elevar conversão.',
      priority: marketingScore >= 0.5 ? 2 : 3,
      strategicCategory: 'Marketing',
    });
  }

  const peaks = [...input.peakHours].sort((a, b) => b.orderShare - a.orderShare).slice(0, 2);
  const peakConcentration = peaks.reduce((acc, p) => acc + p.orderShare, 0);
  const capacityScore = clamp(peakConcentration / 100, 0, 1);
  if (capacityScore >= 0.4) {
    insights.push({
      type: 'opportunity',
      title: 'Monetização de horários de pico',
      diagnosis: 'Alta concentração de pedidos em janelas específicas indica espaço para bundles e dinâmica de preço com foco em margem.',
      impactLevel: levelFromScore(capacityScore),
      estimatedImpact: `${currencyBR(Math.round(input.orders * 0.03 * input.ticketAverage))} ao elevar margem nos picos`,
      recommendedAction: 'Criar combos exclusivos para picos, ajustar preços por demanda e priorizar preparo de itens de alta rotação.',
      priority: 3,
      strategicCategory: 'Revenue',
    });
  }

  insights.sort((a, b) => a.priority - b.priority);
  if (insights.length > 7) {
    return insights.slice(0, 7);
  }
  if (insights.length < 3) {
    return insights.slice(0, 3);
  }
  return insights;
}
