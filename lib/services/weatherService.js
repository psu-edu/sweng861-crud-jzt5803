const axios = require('axios');
const NodeCache = require('node-cache');

const globalForCache = globalThis;
const weatherCache =
  globalForCache._weatherCache ||
  new NodeCache({ stdTTL: 600, checkperiod: 120 });
if (process.env.NODE_ENV !== 'production') {
  globalForCache._weatherCache = weatherCache;
}

const WEATHER_API_BASE = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

class WeatherService {
  validateCoordinates(latitude, longitude) {
    const errors = [];
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push('Latitude must be a valid number');
    } else if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push('Longitude must be a valid number');
    } else if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
    return { isValid: errors.length === 0, errors };
  }

  validateApiResponse(data) {
    const errors = [];
    if (!data) {
      errors.push('No data received from weather API');
      return { isValid: false, errors };
    }
    if (!data.current) {
      errors.push('Missing current weather data');
    }
    if (data.current && typeof data.current.temperature_2m !== 'number') {
      errors.push('Invalid temperature data');
    }
    return { isValid: errors.length === 0, errors };
  }

  async fetchWeatherData(latitude, longitude) {
    const coordValidation = this.validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      throw new Error(
        `Invalid coordinates: ${coordValidation.errors.join(', ')}`
      );
    }

    const cacheKey = `weather_${latitude}_${longitude}`;
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
      console.log(`[WeatherService] Cache hit for ${latitude},${longitude}`);
      return { ...cachedData, fromCache: true };
    }

    try {
      console.log(
        `[WeatherService] Fetching weather for ${latitude},${longitude}`
      );

      const response = await axios.get(WEATHER_API_BASE, {
        params: {
          latitude,
          longitude,
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'wind_speed_10m',
            'weather_code',
          ].join(','),
          timezone: 'auto',
        },
        timeout: 10000,
      });

      const responseValidation = this.validateApiResponse(response.data);
      if (!responseValidation.isValid) {
        throw new Error(
          `Invalid API response: ${responseValidation.errors.join(', ')}`
        );
      }

      const current = response.data.current;
      const weatherCode = current.weather_code;

      const processedData = {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: weatherCode,
        description: WEATHER_CODES[weatherCode] || 'Unknown',
        timezone: response.data.timezone,
        fetchedAt: new Date().toISOString(),
        rawData: response.data,
        fromCache: false,
      };

      weatherCache.set(cacheKey, processedData);
      return processedData;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Weather API error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        throw new Error('Weather API request timeout or network error');
      }
      throw error;
    }
  }

  async fetchAndSaveWeatherData(userId, latitude, longitude) {
    const weatherData = await this.fetchWeatherData(latitude, longitude);

    const { WeatherData } = require('../models');
    const eventEmitter = require('./eventEmitter');

    const savedData = await WeatherData.create({
      userId,
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      weatherCode: weatherData.weatherCode,
      description: weatherData.description,
      rawData: weatherData.rawData,
    });

    await eventEmitter.emitDomainEvent(
      'weather.fetched',
      'WeatherData',
      savedData.id,
      {
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        temperature: weatherData.temperature,
        description: weatherData.description,
      },
      userId
    );

    return savedData;
  }

  async getUserWeatherHistory(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    const { WeatherData } = require('../models');

    const { count, rows } = await WeatherData.findAndCountAll({
      where: { userId },
      order: [['fetchedAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + rows.length < count,
      },
    };
  }

  clearCache() {
    weatherCache.flushAll();
    console.log('[WeatherService] Cache cleared');
  }

  getCacheStats() {
    return weatherCache.getStats();
  }
}

module.exports = new WeatherService();
