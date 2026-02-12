export class CrmMetricsService {
  calculateAverageTicket(totalSpent: number, totalOrders: number): number {
    if (totalOrders <= 0) return 0;
    return totalSpent / totalOrders;
  }

  calculateFrequencyScore(totalOrders: number, lastOrderAt: Date | null): number {
    const now = new Date();
    const daysSinceLast = lastOrderAt
      ? Math.floor((now.getTime() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    return totalOrders * 10 - daysSinceLast;
  }

  isVipSuggested(totalOrders: number, totalSpent: number): boolean {
    return totalOrders >= 10 || totalSpent >= 1000;
  }
}
