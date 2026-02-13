import { startOfDay, endOfDay, subDays } from 'date-fns';
import { DashboardRepository, DashboardDateRanges } from '../../domain/repositories/dashboard.repository';
import { ExecutiveDashboardDTO } from '../../types';
import { CrmMetricsService } from '@/src/modules/customers-crm/src/services/crm-metrics.service';

export class DashboardService {
  private crmMetricsService: CrmMetricsService;

  constructor(private readonly dashboardRepository: DashboardRepository) {
    this.crmMetricsService = new CrmMetricsService();
  }

  async getExecutiveDashboard(
    tenantId: string,
    options?: { period?: '7d' | '30d' | 'custom'; start?: string; end?: string }
  ): Promise<ExecutiveDashboardDTO> {
    const ranges = this.calculateDateRanges(options);

    // Executar todas as queries em paralelo para performance
    const [revenueMetrics, orderMetrics, customerMetrics, topCustomers, deliveryPerformance] = await Promise.all([
      this.dashboardRepository.getRevenueMetrics(tenantId, ranges),
      this.dashboardRepository.getOrderMetrics(tenantId, ranges),
      this.dashboardRepository.getCustomerMetrics(tenantId, ranges),
      this.dashboardRepository.getTopCustomers(tenantId, ranges, 5),
      this.dashboardRepository.getDeliveryPerformance(tenantId, ranges),
    ]);

    // Calcular crescimento percentual (baseado nos últimos 30 dias vs 30 dias anteriores)
    const revenueGrowth = this.calculateGrowth(
      revenueMetrics.last30days,
      revenueMetrics.previous30days
    );

    // Calcular ticket médio
    const ticketMedioHoje = orderMetrics.today > 0 
      ? revenueMetrics.today / orderMetrics.today 
      : 0;
      
    const ticketMedio30d = orderMetrics.last30days > 0 
      ? revenueMetrics.last30days / orderMetrics.last30days 
      : 0;

    // Calcular taxa de recompra
    const taxaRecompra = customerMetrics.activeLast30days > 0
      ? customerMetrics.withMultipleOrders / customerMetrics.activeLast30days
      : 0;

    // Processar top clientes com RFM
    const processedTopCustomers = topCustomers.map(customer => ({
      id: customer.id,
      nome: customer.name,
      totalGasto: customer.totalSpent,
      totalPedidos: customer.totalOrders,
      scoreRFM: this.crmMetricsService.calculateFrequencyScore(
        customer.totalOrders,
        customer.lastOrderAt ?? null
      ),
    }));

    return {
      receita: {
        hoje: revenueMetrics.today,
        ultimos7dias: revenueMetrics.last7days,
        ultimos30dias: revenueMetrics.last30days,
        crescimentoPercentual: revenueGrowth,
      },
      pedidos: {
        hoje: orderMetrics.today,
        ultimos7dias: orderMetrics.last7days,
        ultimos30dias: orderMetrics.last30days,
      },
      ticketMedio: {
        hoje: ticketMedioHoje,
        ultimos30dias: ticketMedio30d,
      },
      clientesAtivos30d: customerMetrics.activeLast30days,
      taxaRecompra: taxaRecompra,
      topClientes: processedTopCustomers,
      performanceEntrega: deliveryPerformance
        ? {
            tempoMedioReal: deliveryPerformance.avgRealTimeMinutes,
            diferencaPrevistoReal: deliveryPerformance.avgDiffPredictedRealMinutes,
          }
        : null,
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateDateRanges(options?: { period?: '7d' | '30d' | 'custom'; start?: string; end?: string }): DashboardDateRanges {
    void options;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Padrões fixos para métricas comparativas (hoje, 7d, 30d são sempre calculados relative a "agora" para o dashboard)
    // A opção "period" pode afetar filtros específicos se expandirmos, mas os requisitos pedem métricas fixas:
    // "Receita (Hoje, Últimos 7 dias, Últimos 30 dias...)"
    // Portanto, calculamos sempre os ranges padrão.
    
    // Se no futuro o "period" customizado alterar o conceito de "Hoje" (ex: "ver dashboard de tal dia"),
    // ajustaríamos aqui. Por enquanto, assumimos "Hoje" como data atual do servidor.

    return {
      todayStart,
      todayEnd,
      sevenDaysStart: subDays(todayStart, 7),
      thirtyDaysStart: subDays(todayStart, 30),
      previousThirtyDaysStart: subDays(todayStart, 60),
      previousThirtyDaysEnd: subDays(todayStart, 30),
    };
  }
}
