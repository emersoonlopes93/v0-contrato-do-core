export interface RevenueMetrics {
  today: number;
  last7days: number;
  last30days: number;
  previous30days: number; // For growth calculation
}

export interface OrderMetrics {
  today: number;
  last7days: number;
  last30days: number;
}

export interface CustomerMetrics {
  activeLast30days: number;
  withMultipleOrders: number; // Subset of active who have > 1 order total
}

export interface TopCustomer {
  id: string;
  name: string;
  totalSpent: number;
  totalOrders: number;
  phone?: string;
  lastOrderAt?: Date | null;
}

export interface DeliveryPerformance {
  avgRealTimeMinutes: number;
  avgDiffPredictedRealMinutes: number;
}

export interface DashboardDateRanges {
  todayStart: Date;
  todayEnd: Date;
  sevenDaysStart: Date;
  thirtyDaysStart: Date;
  previousThirtyDaysStart: Date;
  previousThirtyDaysEnd: Date;
}

export interface DashboardRepository {
  getRevenueMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<RevenueMetrics>;
  getOrderMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<OrderMetrics>;
  getCustomerMetrics(tenantId: string, ranges: DashboardDateRanges): Promise<CustomerMetrics>;
  getTopCustomers(tenantId: string, ranges: DashboardDateRanges, limit: number): Promise<TopCustomer[]>;
  getDeliveryPerformance(tenantId: string, ranges: DashboardDateRanges): Promise<DeliveryPerformance | null>;
}
