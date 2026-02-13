export class WeatherDataProvider {
  async getCurrentWeather(latitude: number, longitude: number): Promise<{
    condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
    temperatureCelsius: number;
    humidityPercentage: number;
    windSpeedKmPerHour: number;
    visibilityKm: number;
    pressureMb: number;
    impactOnDelivery: 'low' | 'medium' | 'high';
  }> {
    void latitude;
    void longitude;
    const mockWeatherData = this.generateMockWeatherData();
    
    return {
      ...mockWeatherData,
      impactOnDelivery: this.calculateDeliveryImpact(mockWeatherData.condition),
    };
  }

  async getWeatherForecast(latitude: number, longitude: number, hoursAhead: number): Promise<Array<{
    timestamp: Date;
    condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
    temperatureCelsius: number;
    impactOnDelivery: 'low' | 'medium' | 'high';
  }>> {
    void latitude;
    void longitude;
    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= hoursAhead; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const weatherData = this.generateMockWeatherData();
      
      forecast.push({
        timestamp: futureTime,
        condition: weatherData.condition,
        temperatureCelsius: weatherData.temperatureCelsius,
        impactOnDelivery: this.calculateDeliveryImpact(weatherData.condition),
      });
    }

    return forecast;
  }

  async getWeatherAlerts(latitude: number, longitude: number): Promise<Array<{
    type: 'storm' | 'flood' | 'snow' | 'fog' | 'extreme_heat' | 'extreme_cold';
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    startTime: Date;
    endTime: Date;
    affectedAreaRadiusKm: number;
    deliveryImpact: {
      speedReductionPercentage: number;
      additionalTimeMinutes: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
  }>> {
    const alerts = [];
    const currentWeather = await this.getCurrentWeather(latitude, longitude);

    if (currentWeather.condition === 'storm') {
      alerts.push({
        type: 'storm' as const,
        severity: 'severe' as const,
        description: 'Tempestade severa com raios e ventos fortes',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        affectedAreaRadiusKm: 15,
        deliveryImpact: {
          speedReductionPercentage: 50,
          additionalTimeMinutes: 30,
          riskLevel: 'high' as const,
        },
      });
    } else if (currentWeather.condition === 'rain') {
      alerts.push({
        type: 'flood' as const,
        severity: 'moderate' as const,
        description: 'Chuva forte com risco de alagamentos',
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        affectedAreaRadiusKm: 10,
        deliveryImpact: {
          speedReductionPercentage: 30,
          additionalTimeMinutes: 15,
          riskLevel: 'medium' as const,
        },
      });
    } else if (currentWeather.condition === 'fog') {
      alerts.push({
        type: 'fog' as const,
        severity: 'minor' as const,
        description: 'Névoa densa reduzindo visibilidade',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        affectedAreaRadiusKm: 20,
        deliveryImpact: {
          speedReductionPercentage: 25,
          additionalTimeMinutes: 10,
          riskLevel: 'medium' as const,
        },
      });
    }

    return alerts;
  }

  private generateMockWeatherData(): {
    condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
    temperatureCelsius: number;
    humidityPercentage: number;
    windSpeedKmPerHour: number;
    visibilityKm: number;
    pressureMb: number;
  } {
    const random = Math.random();
    let condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
    
    if (random < 0.4) {
      condition = 'clear';
    } else if (random < 0.6) {
      condition = 'cloudy';
    } else if (random < 0.8) {
      condition = 'rain';
    } else if (random < 0.9) {
      condition = 'storm';
    } else if (random < 0.95) {
      condition = 'fog';
    } else {
      condition = 'snow';
    }

    const baseTemp = 25;
    const temperatureVariation = {
      clear: 5,
      cloudy: 2,
      rain: -3,
      storm: -5,
      fog: 0,
      snow: -10,
    };

    const temperature = baseTemp + temperatureVariation[condition] + (Math.random() - 0.5) * 5;

    return {
      condition,
      temperatureCelsius: Math.round(temperature),
      humidityPercentage: Math.round(60 + Math.random() * 30),
      windSpeedKmPerHour: Math.round(5 + Math.random() * 25),
      visibilityKm: condition === 'fog' ? Math.random() * 2 : Math.round(5 + Math.random() * 15),
      pressureMb: Math.round(1000 + Math.random() * 30),
    };
  }

  private calculateDeliveryImpact(condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog'): 'low' | 'medium' | 'high' {
    const impactMap = {
      clear: 'low' as const,
      cloudy: 'low' as const,
      rain: 'medium' as const,
      storm: 'high' as const,
      snow: 'high' as const,
      fog: 'medium' as const,
    };

    return impactMap[condition];
  }
}
