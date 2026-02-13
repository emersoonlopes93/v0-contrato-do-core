import type { 
  RouteOptimizationRequest, 
  OptimizedRoute, 
  RoutePoint, 
  RouteConstraints 
} from '../types';

export class RouteOptimizer {
  async optimizeRoute(request: RouteOptimizationRequest): Promise<OptimizedRoute> {
    const { orderIds, constraints, driverId } = request;
    
    const routePoints = await this.getRoutePoints(orderIds);
    const optimizedPoints = await this.optimizeRoutePoints(routePoints, constraints);
    
    const totalDistance = this.calculateTotalDistance(optimizedPoints);
    const estimatedDuration = this.calculateEstimatedDuration(optimizedPoints, totalDistance);
    const estimatedDelayRisk = await this.assessRouteDelayRisk(optimizedPoints);

    return {
      id: `optimized_${Date.now()}`,
      tenantId: request.tenantId,
      driverId: driverId || 'unassigned',
      points: optimizedPoints,
      totalDistanceKm: totalDistance,
      estimatedDurationMinutes: estimatedDuration,
      estimatedDelayRisk,
      fallbackUsed: false,
      createdAt: new Date(),
    };
  }

  async generateAlternativeRoutes(
    originalRoute: RoutePoint[],
    constraints: RouteConstraints
  ): Promise<Array<{
    route: RoutePoint[];
    improvement: {
      timeReductionMinutes: number;
      distanceReductionKm: number;
    };
    confidence: number;
  }>> {
    void constraints;
    const alternatives = [];

    const reorderedRoute = await this.tryReorderStops(originalRoute);
    if (reorderedRoute) {
      const originalDistance = this.calculateTotalDistance(originalRoute);
      const newDistance = this.calculateTotalDistance(reorderedRoute);
      const improvement = {
        timeReductionMinutes: Math.round((originalDistance - newDistance) * 2),
        distanceReductionKm: originalDistance - newDistance,
      };

      if (improvement.distanceReductionKm > 0.5) {
        alternatives.push({
          route: reorderedRoute,
          improvement,
          confidence: 0.8,
        });
      }
    }

    const priorityBasedRoute = await this.tryPriorityOptimization(originalRoute);
    if (priorityBasedRoute) {
      const originalDistance = this.calculateTotalDistance(originalRoute);
      const newDistance = this.calculateTotalDistance(priorityBasedRoute);
      const improvement = {
        timeReductionMinutes: Math.round((originalDistance - newDistance) * 1.5),
        distanceReductionKm: originalDistance - newDistance,
      };

      if (improvement.distanceReductionKm > 0.3) {
        alternatives.push({
          route: priorityBasedRoute,
          improvement,
          confidence: 0.7,
        });
      }
    }

    return alternatives.sort((a, b) => b.improvement.timeReductionMinutes - a.improvement.timeReductionMinutes);
  }

  private async getRoutePoints(orderIds: string[]): Promise<RoutePoint[]> {
    const priorities = ['low', 'medium', 'high'] as const;
    return orderIds.map((orderId, index) => ({
      orderId,
      latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
      longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
      address: `Endereço ${index + 1}`,
      estimatedServiceTime: 5 + Math.random() * 10,
      priority: priorities[Math.floor(Math.random() * priorities.length)] ?? 'medium',
    }));
  }

  private async optimizeRoutePoints(
    points: RoutePoint[],
    constraints: RouteConstraints
  ): Promise<RoutePoint[]> {
    if (points.length <= 2) return points;

    let optimized = [...points];

    optimized = this.applyPriorityOrdering(optimized);
    optimized = this.applyTimeWindowConstraints(optimized, constraints);
    optimized = this.applyDistanceOptimization(optimized);

    if (optimized.length > constraints.maxStopsPerRoute) {
      optimized = optimized.slice(0, constraints.maxStopsPerRoute);
    }

    return optimized;
  }

  private applyPriorityOrdering(points: RoutePoint[]): RoutePoint[] {
    return points.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private applyTimeWindowConstraints(
    points: RoutePoint[],
    constraints: RouteConstraints
  ): RoutePoint[] {
    const now = new Date();
    const currentHour = now.getHours();
    
    const workingStartPart = constraints.workingHoursStart.split(':')[0];
    const workingEndPart = constraints.workingHoursEnd.split(':')[0];
    const workingStart = workingStartPart ? Number(workingStartPart) : currentHour;
    const workingEnd = workingEndPart ? Number(workingEndPart) : currentHour;

    if (currentHour < workingStart || currentHour > workingEnd) {
      return points;
    }

    return points;
  }

  private applyDistanceOptimization(points: RoutePoint[]): RoutePoint[] {
    if (points.length <= 3) return points;

    const firstPoint = points[0];
    if (!firstPoint) return points;
    const optimized = [firstPoint];
    const remaining = points.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      if (!current) break;
      const firstRemaining = remaining[0];
      if (!firstRemaining) break;
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, firstRemaining);

      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!candidate) continue;
        const distance = this.calculateDistance(current, candidate);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining[nearestIndex];
      if (!nearest) break;
      optimized.push(nearest);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  private async tryReorderStops(originalRoute: RoutePoint[]): Promise<RoutePoint[] | null> {
    if (originalRoute.length < 3) return null;

    const optimized = this.applyDistanceOptimization(originalRoute);
    const originalDistance = this.calculateTotalDistance(originalRoute);
    const optimizedDistance = this.calculateTotalDistance(optimized);

    if (optimizedDistance < originalDistance * 0.95) {
      return optimized;
    }

    return null;
  }

  private async tryPriorityOptimization(originalRoute: RoutePoint[]): Promise<RoutePoint[] | null> {
    const highPriority = originalRoute.filter(p => p.priority === 'high');
    const mediumPriority = originalRoute.filter(p => p.priority === 'medium');
    const lowPriority = originalRoute.filter(p => p.priority === 'low');

    if (highPriority.length === 0) return null;

    const optimized = [
      ...this.applyDistanceOptimization(highPriority),
      ...this.applyDistanceOptimization(mediumPriority),
      ...this.applyDistanceOptimization(lowPriority),
    ];

    return optimized;
  }

  private calculateTotalDistance(points: RoutePoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const next = points[i];
      if (!prev || !next) continue;
      totalDistance += this.calculateDistance(prev, next);
    }
    return totalDistance;
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371;
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateEstimatedDuration(points: RoutePoint[], distanceKm: number): number {
    const averageSpeedKmPerHour = 30;
    const travelTime = (distanceKm / averageSpeedKmPerHour) * 60;
    const serviceTime = points.reduce((sum, point) => sum + point.estimatedServiceTime, 0);
    return Math.round(travelTime + serviceTime);
  }

  private async assessRouteDelayRisk(points: RoutePoint[]): Promise<'none' | 'low' | 'medium' | 'high'> {
    const totalServiceTime = points.reduce((sum, point) => sum + point.estimatedServiceTime, 0);
    const highPriorityCount = points.filter(p => p.priority === 'high').length;
    const pointCount = points.length;

    if (pointCount > 8 || totalServiceTime > 60) return 'high';
    if (pointCount > 6 || totalServiceTime > 45) return 'medium';
    if (highPriorityCount > 2) return 'medium';
    if (pointCount > 4) return 'low';

    return 'none';
  }

  async validateRoute(route: OptimizedRoute): Promise<{
    isValid: boolean;
    violations: string[];
    score: number;
  }> {
    const violations = [];
    let score = 100;

    if (route.points.length > 10) {
      violations.push('Rota com muitas paradas');
      score -= 20;
    }

    if (route.estimatedDurationMinutes > 120) {
      violations.push('Tempo estimado muito longo');
      score -= 15;
    }

    if (route.totalDistanceKm > 50) {
      violations.push('Distância total muito longa');
      score -= 10;
    }

    if (route.estimatedDelayRisk === 'high') {
      violations.push('Alto risco de atraso');
      score -= 25;
    }

    return {
      isValid: violations.length === 0,
      violations,
      score: Math.max(0, score),
    };
  }
}
