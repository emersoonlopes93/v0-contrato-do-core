export class TrafficDataProvider {
  async getCurrentTraffic(latitude: number, longitude: number): Promise<{
    level: 'low' | 'medium' | 'high';
    speedKmPerHour: number;
    congestionPercentage: number;
    incidents: Array<{
      type: string;
      severity: 'minor' | 'moderate' | 'major';
      description: string;
      distanceKm: number;
    }>;
  }> {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    let level: 'low' | 'medium' | 'high' = 'low';
    let speedKmPerHour = 50;
    let congestionPercentage = 20;

    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        level = 'high';
        speedKmPerHour = 20;
        congestionPercentage = 75;
      } else {
        level = 'medium';
        speedKmPerHour = 35;
        congestionPercentage = 45;
      }
    } else if (hour >= 11 && hour <= 16) {
      level = 'medium';
      speedKmPerHour = 40;
      congestionPercentage = 35;
    }

    const incidents = this.generateMockIncidents(level);

    return {
      level,
      speedKmPerHour,
      congestionPercentage,
      incidents,
    };
  }

  async getTrafficForecast(latitude: number, longitude: number, hoursAhead: number): Promise<Array<{
    timestamp: Date;
    level: 'low' | 'medium' | 'high';
    speedKmPerHour: number;
    congestionPercentage: number;
  }>> {
    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= hoursAhead; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = futureTime.getHours();
      const dayOfWeek = futureTime.getDay();

      let level: 'low' | 'medium' | 'high' = 'low';
      let speedKmPerHour = 50;
      let congestionPercentage = 20;

      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          level = 'high';
          speedKmPerHour = 20;
          congestionPercentage = 75;
        } else {
          level = 'medium';
          speedKmPerHour = 35;
          congestionPercentage = 45;
        }
      } else if (hour >= 11 && hour <= 16) {
        level = 'medium';
        speedKmPerHour = 40;
        congestionPercentage = 35;
      }

      forecast.push({
        timestamp: futureTime,
        level,
        speedKmPerHour,
        congestionPercentage,
      });
    }

    return forecast;
  }

  async getRouteTraffic(waypoints: Array<{ latitude: number; longitude: number }>): Promise<{
    totalDistanceKm: number;
    averageSpeedKmPerHour: number;
    trafficLevel: 'low' | 'medium' | 'high';
    highTrafficSegments: Array<{
      startWaypointIndex: number;
      endWaypointIndex: number;
      level: 'medium' | 'high';
      delayMinutes: number;
    }>;
  }> {
    let totalDistanceKm = 0;
    let totalSpeed = 0;
    let speedMeasurements = 0;
    const highTrafficSegments = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      const segmentDistance = this.calculateDistance(start, end);
      const segmentTraffic = await this.getCurrentTraffic(
        (start.latitude + end.latitude) / 2,
        (start.longitude + end.longitude) / 2
      );

      totalDistanceKm += segmentDistance;
      totalSpeed += segmentTraffic.speedKmPerHour;
      speedMeasurements++;

      if (segmentTraffic.level === 'high' || segmentTraffic.level === 'medium') {
        const expectedSpeed = 50;
        const delayMinutes = ((segmentDistance / segmentTraffic.speedKmPerHour) - (segmentDistance / expectedSpeed)) * 60;
        
        highTrafficSegments.push({
          startWaypointIndex: i,
          endWaypointIndex: i + 1,
          level: segmentTraffic.level,
          delayMinutes: Math.max(0, Math.round(delayMinutes)),
        });
      }
    }

    const averageSpeedKmPerHour = speedMeasurements > 0 ? totalSpeed / speedMeasurements : 50;
    
    let trafficLevel: 'low' | 'medium' | 'high' = 'low';
    if (averageSpeedKmPerHour < 25) {
      trafficLevel = 'high';
    } else if (averageSpeedKmPerHour < 40) {
      trafficLevel = 'medium';
    }

    return {
      totalDistanceKm,
      averageSpeedKmPerHour,
      trafficLevel,
      highTrafficSegments,
    };
  }

  private generateMockIncidents(trafficLevel: 'low' | 'medium' | 'high'): Array<{
    type: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    distanceKm: number;
  }> {
    const incidents = [];

    if (trafficLevel === 'high') {
      if (Math.random() > 0.7) {
        incidents.push({
          type: 'accident',
          severity: 'moderate' as const,
          description: 'Acidente bloqueando uma faixa da via',
          distanceKm: Math.random() * 2 + 0.5,
        });
      }
      if (Math.random() > 0.8) {
        incidents.push({
          type: 'construction',
          severity: 'minor' as const,
          description: 'Obras na via com redução de velocidade',
          distanceKm: Math.random() * 3 + 1,
        });
      }
    } else if (trafficLevel === 'medium') {
      if (Math.random() > 0.9) {
        incidents.push({
          type: 'construction',
          severity: 'minor' as const,
          description: 'Pequenas obras na via',
          distanceKm: Math.random() * 2 + 0.5,
        });
      }
    }

    return incidents;
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
}
