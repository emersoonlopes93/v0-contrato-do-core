export class TrafficAnalyzer {
  async analyzeTrafficConditions(
    latitude: number,
    longitude: number,
    timeWindow: number = 60
  ): Promise<{
    currentLevel: 'low' | 'medium' | 'high';
    averageSpeed: number;
    congestionIndex: number;
    incidents: Array<{
      type: string;
      severity: 'minor' | 'moderate' | 'severe';
      distance: number;
      impact: number;
    }>;
    forecast: Array<{
      time: Date;
      level: 'low' | 'medium' | 'high';
      speed: number;
    }>;
  }> {
    const currentHour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    const currentLevel = this.getCurrentTrafficLevel(currentHour, dayOfWeek);
    const averageSpeed = this.getAverageSpeed(currentLevel);
    const congestionIndex = this.getCongestionIndex(currentLevel);
    const incidents = this.generateMockIncidents(currentLevel);
    const forecast = this.generateTrafficForecast(currentHour, dayOfWeek, timeWindow);

    return {
      currentLevel,
      averageSpeed,
      congestionIndex,
      incidents,
      forecast,
    };
  }

  async analyzeRouteTraffic(
    waypoints: Array<{ latitude: number; longitude: number }>
  ): Promise<{
    totalDistance: number;
    averageSpeed: number;
    trafficLevel: 'low' | 'medium' | 'high';
    highTrafficSegments: Array<{
      startWaypointIndex: number;
      endWaypointIndex: number;
      level: 'medium' | 'high';
      delay: number;
      cause: string;
    }>;
    alternativeRoutes: Array<{
      route: Array<{ latitude: number; longitude: number }>;
      timeReduction: number;
      confidence: number;
    }>;
  }> {
    let totalDistance = 0;
    let totalSpeed = 0;
    const highTrafficSegments = [];
    let speedMeasurements = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      if (!start || !end) continue;
      
      const segmentDistance = this.calculateDistance(start, end);
      const segmentTraffic = await this.analyzeTrafficConditions(
        (start.latitude + end.latitude) / 2,
        (start.longitude + end.longitude) / 2
      );

      totalDistance += segmentDistance;
      totalSpeed += segmentTraffic.averageSpeed;
      speedMeasurements++;

      if (segmentTraffic.currentLevel === 'high' || segmentTraffic.currentLevel === 'medium') {
        const expectedSpeed = 50;
        const delay = ((segmentDistance / segmentTraffic.averageSpeed) - (segmentDistance / expectedSpeed)) * 60;
        
        highTrafficSegments.push({
          startWaypointIndex: i,
          endWaypointIndex: i + 1,
          level: segmentTraffic.currentLevel,
          delay: Math.max(0, Math.round(delay)),
          cause: this.getTrafficCause(segmentTraffic.currentLevel),
        });
      }
    }

    const averageSpeed = speedMeasurements > 0 ? totalSpeed / speedMeasurements : 50;
    
    let trafficLevel: 'low' | 'medium' | 'high' = 'low';
    if (averageSpeed < 25) {
      trafficLevel = 'high';
    } else if (averageSpeed < 40) {
      trafficLevel = 'medium';
    }

    const alternativeRoutes = await this.generateAlternativeRoutes(waypoints);

    return {
      totalDistance,
      averageSpeed,
      trafficLevel,
      highTrafficSegments,
      alternativeRoutes,
    };
  }

  private getCurrentTrafficLevel(hour: number, dayOfWeek: number): 'low' | 'medium' | 'high' {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isLunchTime = hour >= 11 && hour <= 13;

    if (isRushHour && !isWeekend) {
      return 'high';
    } else if (isLunchTime || (isRushHour && isWeekend)) {
      return 'medium';
    } else if (hour >= 10 && hour <= 16) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getAverageSpeed(trafficLevel: 'low' | 'medium' | 'high'): number {
    const speeds = {
      low: 45 + Math.random() * 10,
      medium: 25 + Math.random() * 15,
      high: 15 + Math.random() * 10,
    };
    return speeds[trafficLevel];
  }

  private getCongestionIndex(trafficLevel: 'low' | 'medium' | 'high'): number {
    const indices = {
      low: 0.2 + Math.random() * 0.2,
      medium: 0.5 + Math.random() * 0.2,
      high: 0.8 + Math.random() * 0.2,
    };
    return indices[trafficLevel];
  }

  private generateMockIncidents(trafficLevel: 'low' | 'medium' | 'high') {
    const incidents = [];

    if (trafficLevel === 'high') {
      if (Math.random() > 0.7) {
        incidents.push({
          type: 'acidente',
          severity: 'moderate' as const,
          distance: Math.random() * 2 + 0.5,
          impact: 0.6,
        });
      }
      if (Math.random() > 0.8) {
        incidents.push({
          type: 'obras',
          severity: 'minor' as const,
          distance: Math.random() * 3 + 1,
          impact: 0.3,
        });
      }
    } else if (trafficLevel === 'medium') {
      if (Math.random() > 0.9) {
        incidents.push({
          type: 'obras',
          severity: 'minor' as const,
          distance: Math.random() * 2 + 0.5,
          impact: 0.2,
        });
      }
    }

    return incidents;
  }

  private generateTrafficForecast(currentHour: number, dayOfWeek: number, timeWindow: number) {
    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= timeWindow; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const futureHour = futureTime.getHours();
      
      const level = this.getCurrentTrafficLevel(futureHour, dayOfWeek);
      const speed = this.getAverageSpeed(level);

      forecast.push({
        time: futureTime,
        level,
        speed,
      });
    }

    return forecast;
  }

  private async generateAlternativeRoutes(waypoints: Array<{ latitude: number; longitude: number }>) {
    const alternatives = [];

    if (waypoints.length >= 3) {
      const reorderedRoute = this.generateReorderedRoute(waypoints);
      alternatives.push({
        route: reorderedRoute,
        timeReduction: Math.random() * 10 + 5,
        confidence: 0.7,
      });
    }

    if (Math.random() > 0.7) {
      const bypassRoute = this.generateBypassRoute(waypoints);
      alternatives.push({
        route: bypassRoute,
        timeReduction: Math.random() * 15 + 8,
        confidence: 0.6,
      });
    }

    return alternatives.sort((a, b) => b.timeReduction - a.timeReduction);
  }

  private generateReorderedRoute(waypoints: Array<{ latitude: number; longitude: number }>) {
    const first = waypoints[0];
    if (!first) return [];
    const reordered = [first];
    const remaining = waypoints.slice(1);

    while (remaining.length > 0) {
      const current = reordered[reordered.length - 1];
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
      reordered.push(nearest);
      remaining.splice(nearestIndex, 1);
    }

    return reordered;
  }

  private generateBypassRoute(waypoints: Array<{ latitude: number; longitude: number }>) {
    return waypoints.map(point => ({
      latitude: point.latitude + (Math.random() - 0.5) * 0.01,
      longitude: point.longitude + (Math.random() - 0.5) * 0.01,
    }));
  }

  private getTrafficCause(level: 'low' | 'medium' | 'high'): string {
    const causes = {
      low: 'Tráfego fluído',
      medium: 'Tráfego moderado - volume elevado de veículos',
      high: 'Tráfego intenso - congestionamento severo',
    };
    return causes[level];
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
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

  async predictTrafficEvolution(
    latitude: number,
    longitude: number,
    hoursAhead: number = 6
  ): Promise<{
    predictions: Array<{
      time: Date;
      level: 'low' | 'medium' | 'high';
      confidence: number;
      factors: string[];
    }>;
    recommendations: string[];
  }> {
    const currentAnalysis = await this.analyzeTrafficConditions(latitude, longitude);
    const predictions = [];
    const recommendations = [];

    const now = new Date();
    for (let i = 1; i <= hoursAhead; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const futureHour = futureTime.getHours();
      const dayOfWeek = futureTime.getDay();
      
      const predictedLevel = this.getCurrentTrafficLevel(futureHour, dayOfWeek);
      const confidence = 0.8 - (i * 0.1);
      
      const factors = this.getPredictionFactors(futureHour, dayOfWeek, predictedLevel);
      
      predictions.push({
        time: futureTime,
        level: predictedLevel,
        confidence: Math.max(0.3, confidence),
        factors,
      });
    }

    if (currentAnalysis.currentLevel === 'high') {
      recommendations.push('Considerar rotas alternativas imediatamente');
      recommendations.push('Ajustar horários de entrega para evitar picos');
    } else if (predictions.some(p => p.level === 'high')) {
      recommendations.push('Planejar rotas alternativas para horários de pico');
    }

    return {
      predictions,
      recommendations,
    };
  }

  private getPredictionFactors(hour: number, dayOfWeek: number, level: 'low' | 'medium' | 'high'): string[] {
    const factors = [];
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    if (isRushHour && !isWeekend) {
      factors.push('Horário de pico de trânsito');
    }
    if (isWeekend) {
      factors.push('Tráfego de final de semana');
    }
    if (level === 'high') {
      factors.push('Condições adversas de tráfego');
    }

    return factors;
  }
}
