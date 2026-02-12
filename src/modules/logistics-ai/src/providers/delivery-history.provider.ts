import type { DeliveryHistoryData } from '../types';

export class DeliveryHistoryProvider {
  async getDeliveryHistory(tenantId: string, options?: {
    driverId?: string;
    startDate?: Date;
    endDate?: Date;
    region?: string;
    limit?: number;
  }): Promise<DeliveryHistoryData[]> {
    const mockData: DeliveryHistoryData[] = [
      {
        orderId: 'order_001',
        driverId: 'driver_001',
        distanceKm: 5.2,
        etaOriginal: new Date('2024-01-15T10:00:00Z'),
        etaReal: new Date('2024-01-15T10:25:00Z'),
        status: 'completed',
        delayMinutes: 25,
        hourOfDay: 10,
        dayOfWeek: 1,
        region: 'centro',
        weatherCondition: 'clear',
        trafficLevel: 'medium',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        orderId: 'order_002',
        driverId: 'driver_001',
        distanceKm: 3.8,
        etaOriginal: new Date('2024-01-15T14:30:00Z'),
        etaReal: new Date('2024-01-15T14:35:00Z'),
        status: 'completed',
        delayMinutes: 5,
        hourOfDay: 14,
        dayOfWeek: 1,
        region: 'centro',
        weatherCondition: 'rain',
        trafficLevel: 'high',
        createdAt: new Date('2024-01-15T14:30:00Z'),
      },
      {
        orderId: 'order_003',
        driverId: 'driver_002',
        distanceKm: 7.1,
        etaOriginal: new Date('2024-01-15T18:00:00Z'),
        etaReal: new Date('2024-01-15T18:45:00Z'),
        status: 'delayed',
        delayMinutes: 45,
        hourOfDay: 18,
        dayOfWeek: 1,
        region: 'norte',
        weatherCondition: 'clear',
        trafficLevel: 'high',
        createdAt: new Date('2024-01-15T18:00:00Z'),
      },
    ];

    let filteredData = mockData;

    if (options?.driverId) {
      filteredData = filteredData.filter(data => data.driverId === options.driverId);
    }

    if (options?.startDate) {
      filteredData = filteredData.filter(data => data.createdAt >= options.startDate!);
    }

    if (options?.endDate) {
      filteredData = filteredData.filter(data => data.createdAt <= options.endDate!);
    }

    if (options?.region) {
      filteredData = filteredData.filter(data => data.region === options.region);
    }

    if (options?.limit) {
      filteredData = filteredData.slice(0, options.limit);
    }

    return filteredData;
  }

  async getDriverPerformance(tenantId: string, driverId: string, days: number = 30): Promise<{
    totalDeliveries: number;
    averageDelayMinutes: number;
    onTimePercentage: number;
    averageDistanceKm: number;
    performanceByRegion: Record<string, {
      deliveries: number;
      averageDelay: number;
    }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.getDeliveryHistory(tenantId, { driverId, startDate });

    const totalDeliveries = history.length;
    const averageDelayMinutes = history.reduce((sum, d) => sum + d.delayMinutes, 0) / totalDeliveries;
    const onTimeDeliveries = history.filter(d => d.delayMinutes <= 5).length;
    const onTimePercentage = (onTimeDeliveries / totalDeliveries) * 100;
    const averageDistanceKm = history.reduce((sum, d) => sum + d.distanceKm, 0) / totalDeliveries;

    const performanceByRegion: Record<string, { deliveries: number; averageDelay: number }> = {};
    
    history.forEach(delivery => {
      if (!performanceByRegion[delivery.region]) {
        performanceByRegion[delivery.region] = { deliveries: 0, averageDelay: 0 };
      }
      performanceByRegion[delivery.region].deliveries++;
      performanceByRegion[delivery.region].averageDelay += delivery.delayMinutes;
    });

    Object.keys(performanceByRegion).forEach(region => {
      const regionData = performanceByRegion[region];
      regionData.averageDelay = regionData.averageDelay / regionData.deliveries;
    });

    return {
      totalDeliveries,
      averageDelayMinutes,
      onTimePercentage,
      averageDistanceKm,
      performanceByRegion,
    };
  }

  async getRegionAnalytics(tenantId: string, region: string, days: number = 30): Promise<{
    totalDeliveries: number;
    averageDelayMinutes: number;
    peakDelayHours: number[];
    commonWeatherConditions: Record<string, number>;
    trafficImpact: {
      low: number;
      medium: number;
      high: number;
    };
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.getDeliveryHistory(tenantId, { region, startDate });

    const totalDeliveries = history.length;
    const averageDelayMinutes = history.reduce((sum, d) => sum + d.delayMinutes, 0) / totalDeliveries;

    const delaysByHour: Record<number, number[]> = {};
    history.forEach(delivery => {
      if (!delaysByHour[delivery.hourOfDay]) {
        delaysByHour[delivery.hourOfDay] = [];
      }
      delaysByHour[delivery.hourOfDay].push(delivery.delayMinutes);
    });

    const averageDelayByHour: Record<number, number> = {};
    Object.keys(delaysByHour).forEach(hour => {
      const delays = delaysByHour[parseInt(hour)];
      averageDelayByHour[parseInt(hour)] = delays.reduce((sum, d) => sum + d, 0) / delays.length;
    });

    const peakDelayHours = Object.entries(averageDelayByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const weatherConditions: Record<string, number> = {};
    history.forEach(delivery => {
      if (delivery.weatherCondition) {
        weatherConditions[delivery.weatherCondition] = (weatherConditions[delivery.weatherCondition] || 0) + 1;
      }
    });

    const trafficImpact = {
      low: 0,
      medium: 0,
      high: 0,
    };

    history.forEach(delivery => {
      if (delivery.trafficLevel) {
        trafficImpact[delivery.trafficLevel]++;
      }
    });

    return {
      totalDeliveries,
      averageDelayMinutes,
      peakDelayHours,
      commonWeatherConditions: weatherConditions,
      trafficImpact,
    };
  }
}
