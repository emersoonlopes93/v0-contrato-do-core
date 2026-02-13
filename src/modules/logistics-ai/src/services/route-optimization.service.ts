import type { 
  RouteSuggestion, 
  RouteOptimizationRequest, 
  OptimizedRoute, 
  RoutePoint,
  PredictedDelay,
  RouteConstraints
} from '../types';
import { LogisticsAiLogger } from '../utils/logistics-ai.logger';
import { LogisticsAiFeatureFlags } from '../utils/feature-flags';
import { withTimeout, TimeoutError } from '../utils/timeout';
import { LogisticsAiRepository } from '../repositories/logistics-ai.repository';

export class RouteOptimizationService {
  private repository: LogisticsAiRepository;

  constructor() {
    this.repository = LogisticsAiRepository.getInstance();
  }
  async generateRouteSuggestions(tenantId: string, driverId: string): Promise<RouteSuggestion[]> {
    // Feature flag check
    const canUse = await LogisticsAiFeatureFlags.canUseRouteOptimization(tenantId);
    if (!canUse) {
      return [];
    }

    try {
      const suggestions: RouteSuggestion[] = [];
      
      const currentRoute = await this.getCurrentRoute(driverId);
      if (!currentRoute || currentRoute.points.length < 2) {
        return suggestions;
      }

      const reorderSuggestion = await this.generateReorderSuggestion(tenantId, currentRoute);
      if (reorderSuggestion) suggestions.push(reorderSuggestion);

      const alternativeRouteSuggestion = await this.generateAlternativeRouteSuggestion(tenantId, currentRoute);
      if (alternativeRouteSuggestion) suggestions.push(alternativeRouteSuggestion);

      const driverChangeSuggestion = await this.generateDriverChangeSuggestion(tenantId, currentRoute);
      if (driverChangeSuggestion) suggestions.push(driverChangeSuggestion);

      return suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      LogisticsAiLogger.error(tenantId, 'Error generating route suggestions', error as Error, {
        decisionType: 'route_suggestion'
      });
      return [];
    }
  }

  async optimizeRoute(tenantId: string, request: RouteOptimizationRequest): Promise<OptimizedRoute> {
    // Feature flag check
    const canUse = await LogisticsAiFeatureFlags.canUseRouteOptimization(tenantId);
    if (!canUse) {
      throw new Error('Route optimization is disabled for this tenant');
    }

    try {
      // Apply timeout to optimization
      const optimizedPoints = await withTimeout(
        this.optimizeRoutePoints(request.orderIds, request.constraints),
        1500,
        tenantId,
        'route_optimization'
      );
      
      const totalDistance = this.calculateTotalDistance(optimizedPoints);
      const estimatedDuration = this.calculateEstimatedDuration(optimizedPoints, totalDistance);
      const delayRisk = await this.assessRouteDelayRisk(optimizedPoints);

      const optimizedRoute: OptimizedRoute = {
        id: `route_${Date.now()}`,
        tenantId,
        driverId: request.driverId || 'unassigned',
        points: optimizedPoints,
        totalDistanceKm: totalDistance,
        estimatedDurationMinutes: estimatedDuration,
        estimatedDelayRisk: delayRisk,
        fallbackUsed: false,
        createdAt: new Date(),
      };

      // Async logging
      this.logDecisionAsync(tenantId, {
        tenantId,
        type: 'route',
        input: { request },
        output: optimizedRoute as unknown as Record<string, unknown>,
        confidenceScore: 0.8, // Default confidence for route optimization
        fallbackUsed: false
      }).catch((error: Error) => {
        LogisticsAiLogger.error(tenantId, 'Failed to log route decision', error, {
          decisionType: 'route_optimization'
        });
      });

      return optimizedRoute;
    } catch (error) {
      if (error instanceof TimeoutError) {
        // Return fallback route on timeout
        const fallbackRoute = this.createFallbackRoute(tenantId, request);
        
        this.logDecisionAsync(tenantId, {
          tenantId,
          type: 'route',
          input: { request, timeout: true },
          output: fallbackRoute as unknown as Record<string, unknown>,
          confidenceScore: 0.1,
          fallbackUsed: true
        }).catch(() => {});
        
        return fallbackRoute;
      }
      
      LogisticsAiLogger.error(tenantId, 'Error optimizing route', error as Error, {
        decisionType: 'route_optimization'
      });
      throw error;
    }
  }

  private async getCurrentRoute(driverId: string): Promise<{ points: RoutePoint[] } | null> {
    void driverId;
    return null;
  }

  private async generateReorderSuggestion(tenantId: string, currentRoute: { points: RoutePoint[] }): Promise<RouteSuggestion | null> {
    if (currentRoute.points.length < 3) return null;

    const reorderedPoints = this.calculateOptimalOrder(currentRoute.points);
    const currentDistance = this.calculateTotalDistance(currentRoute.points);
    const optimizedDistance = this.calculateTotalDistance(reorderedPoints);
    
    const improvement = currentDistance - optimizedDistance;
    if (improvement < 1) return null;

    return {
      id: `suggest_reorder_${Date.now()}`,
      tenantId,
      type: 'reorder_stops',
      priority: improvement > 3 ? 'high' : 'medium',
      title: 'Reordenar Paradas',
      description: `Reordenar paradas pode reduzir ${improvement.toFixed(1)} km na distância total`,
      estimatedImprovement: {
        timeReductionMinutes: Math.round(improvement * 2),
        distanceReductionKm: improvement,
        delayRiskReduction: 0.2,
      },
      confidence: 0.8,
      requiresConfirmation: true,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };
  }

  private async generateAlternativeRouteSuggestion(tenantId: string, currentRoute: { points: RoutePoint[] }): Promise<RouteSuggestion | null> {
    const trafficConditions = await this.getTrafficConditions(currentRoute.points);
    
    if (trafficConditions.some(condition => condition === 'high')) {
      return {
        id: `suggest_alternative_${Date.now()}`,
        tenantId,
        type: 'alternative_route',
        priority: 'medium',
        title: 'Rota Alternativa',
        description: 'Tráfego intenso detectado. Rota alternativa disponível.',
        estimatedImprovement: {
          timeReductionMinutes: 15,
          distanceReductionKm: 2,
          delayRiskReduction: 0.3,
        },
        confidence: 0.7,
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };
    }

    return null;
  }

  private async generateDriverChangeSuggestion(tenantId: string, currentRoute: { points: RoutePoint[] }): Promise<RouteSuggestion | null> {
    const firstPoint = currentRoute.points[0];
    if (!firstPoint) return null;
    
    const driverPerformance = await this.getDriverPerformance(firstPoint.orderId);
    
    if (driverPerformance && driverPerformance.averageDelayMinutes > 20) {
      return {
        id: `suggest_driver_change_${Date.now()}`,
        tenantId,
        type: 'change_driver',
        priority: 'low',
        title: 'Considerar Troca de Entregador',
        description: 'Entregador atual apresenta alta taxa de atrasos nesta região',
        estimatedImprovement: {
          timeReductionMinutes: 10,
          distanceReductionKm: 0,
          delayRiskReduction: 0.4,
        },
        confidence: 0.6,
        requiresConfirmation: true,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      };
    }

    return null;
  }

  private async optimizeRoutePoints(orderIds: string[], constraints: RouteConstraints): Promise<RoutePoint[]> {
    void orderIds;
    void constraints;
    return [];
  }

  private calculateOptimalOrder(points: RoutePoint[]): RoutePoint[] {
    return [...points].sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return 0;
    });
  }

  private calculateTotalDistance(points: RoutePoint[]): number {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const next = points[i];
      if (!prev || !next) continue;
      const distance = this.calculateDistance(prev, next);
      totalDistance += distance;
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

  private async assessRouteDelayRisk(points: RoutePoint[]): Promise<PredictedDelay> {
    void points;
    return 'low';
  }

  private async getTrafficConditions(points: RoutePoint[]): Promise<string[]> {
    return points.map(() => 'medium');
  }

  private async getDriverPerformance(orderId: string): Promise<{ averageDelayMinutes: number } | null> {
    void orderId;
    return null;
  }

  private createFallbackRoute(tenantId: string, request: RouteOptimizationRequest): OptimizedRoute {
    return {
      id: `route_fallback_${Date.now()}`,
      tenantId,
      driverId: request.driverId || 'unassigned',
      points: [],
      totalDistanceKm: 0,
      estimatedDurationMinutes: 0,
      estimatedDelayRisk: 'none',
      fallbackUsed: true,
      createdAt: new Date(),
    };
  }

  private async logDecisionAsync(tenantId: string, logData: {
    tenantId: string;
    type: 'delay' | 'route' | 'alert';
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    confidenceScore: number;
    fallbackUsed: boolean;
  }): Promise<void> {
    await this.repository.saveDecisionLog(logData);
  }
}
