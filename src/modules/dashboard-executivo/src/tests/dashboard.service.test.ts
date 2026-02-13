import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../application/services/dashboard.service';
import type { DashboardRepository } from '../domain/repositories/dashboard.repository';
import type { 
  RevenueMetrics, 
  OrderMetrics, 
  CustomerMetrics, 
  TopCustomer,
  DeliveryPerformance 
} from '../domain/repositories/dashboard.repository';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockRepository: DashboardRepository;

  const mockRevenueMetrics: RevenueMetrics = {
    today: 1000,
    last7days: 7000,
    last30days: 30000,
    previous30days: 25000,
  };

  const mockOrderMetrics: OrderMetrics = {
    today: 10,
    last7days: 70,
    last30days: 300,
  };

  const mockCustomerMetrics: CustomerMetrics = {
    activeLast30days: 100,
    withMultipleOrders: 20,
  };

  const mockTopCustomers: TopCustomer[] = [
    {
      id: '1',
      name: 'Cliente 1',
      totalSpent: 5000,
      totalOrders: 5,
      phone: '1234567890',
      lastOrderAt: new Date(),
    },
  ];

  const mockDeliveryPerformance: DeliveryPerformance = {
    avgRealTimeMinutes: 45,
    avgDiffPredictedRealMinutes: 5,
  };

  beforeEach(() => {
    mockRepository = {
      getRevenueMetrics: vi.fn().mockResolvedValue(mockRevenueMetrics),
      getOrderMetrics: vi.fn().mockResolvedValue(mockOrderMetrics),
      getCustomerMetrics: vi.fn().mockResolvedValue(mockCustomerMetrics),
      getTopCustomers: vi.fn().mockResolvedValue(mockTopCustomers),
      getDeliveryPerformance: vi.fn().mockResolvedValue(mockDeliveryPerformance),
    };

    dashboardService = new DashboardService(mockRepository);
  });

  it('deve calcular métricas corretamente', async () => {
    const result = await dashboardService.getExecutiveDashboard('tenant-1', { period: '30d' });

    // Receita
    expect(result.receita.hoje).toBe(1000);
    expect(result.receita.ultimos30dias).toBe(30000);
    // Crescimento: (30000 - 25000) / 25000 * 100 = 20%
    expect(result.receita.crescimentoPercentual).toBe(20);

    // Ticket Médio
    // Hoje: 1000 / 10 = 100
    expect(result.ticketMedio.hoje).toBe(100);
    // 30 dias: 30000 / 300 = 100
    expect(result.ticketMedio.ultimos30dias).toBe(100);

    // Taxa de Recompra
    // 20 / 100 = 0.2
    expect(result.taxaRecompra).toBe(0.2);

    // Top Clientes
    expect(result.topClientes).toHaveLength(1);
    const firstCliente = result.topClientes[0];
    expect(firstCliente).toBeDefined();
    if (!firstCliente) {
      throw new Error('Top cliente ausente');
    }
    expect(firstCliente.nome).toBe('Cliente 1');
    expect(firstCliente.scoreRFM).toBeDefined();
  });

  it('deve lidar com divisão por zero no ticket médio', async () => {
    mockRepository.getOrderMetrics = vi.fn().mockResolvedValue({
      ...mockOrderMetrics,
      today: 0,
      last30days: 0,
    });

    const result = await dashboardService.getExecutiveDashboard('tenant-1');

    expect(result.ticketMedio.hoje).toBe(0);
    expect(result.ticketMedio.ultimos30dias).toBe(0);
  });

  it('deve lidar com divisão por zero no crescimento', async () => {
    mockRepository.getRevenueMetrics = vi.fn().mockResolvedValue({
      ...mockRevenueMetrics,
      previous30days: 0,
    });

    const result = await dashboardService.getExecutiveDashboard('tenant-1');

    expect(result.receita.crescimentoPercentual).toBe(100);
  });

  it('deve lidar com métricas nulas de entrega', async () => {
    mockRepository.getDeliveryPerformance = vi.fn().mockResolvedValue(null);

    const result = await dashboardService.getExecutiveDashboard('tenant-1');

    expect(result.performanceEntrega).toBeNull();
  });
});
