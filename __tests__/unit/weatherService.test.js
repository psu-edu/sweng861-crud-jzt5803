const axios = require('axios');

// Mock axios to avoid real external API calls
jest.mock('axios');

// Suppress console.log during tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  console.log.mockRestore();
});

// Use a single WeatherService instance and clear cache between tests
const weatherService = require('@/lib/services/weatherService');

beforeEach(() => {
  weatherService.clearCache();
});

const mockApiResponse = {
  data: {
    latitude: 40.8,
    longitude: -77.86,
    timezone: 'America/New_York',
    current: {
      temperature_2m: 22.5,
      relative_humidity_2m: 65,
      wind_speed_10m: 12.3,
      weather_code: 2,
    },
  },
};

// ============================================
// validateCoordinates
// ============================================
describe('WeatherService.validateCoordinates', () => {
  it('accepts valid coordinates', () => {
    const result = weatherService.validateCoordinates(40.7983, -77.8599);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects non-numeric latitude', () => {
    const result = weatherService.validateCoordinates('abc', -77);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Latitude/);
  });

  it('rejects latitude out of range (> 90)', () => {
    const result = weatherService.validateCoordinates(91, 0);
    expect(result.isValid).toBe(false);
  });

  it('rejects latitude out of range (< -90)', () => {
    const result = weatherService.validateCoordinates(-91, 0);
    expect(result.isValid).toBe(false);
  });

  it('rejects non-numeric longitude', () => {
    const result = weatherService.validateCoordinates(40, null);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Longitude/);
  });

  it('rejects longitude out of range (> 180)', () => {
    const result = weatherService.validateCoordinates(0, 181);
    expect(result.isValid).toBe(false);
  });

  it('rejects longitude out of range (< -180)', () => {
    const result = weatherService.validateCoordinates(0, -181);
    expect(result.isValid).toBe(false);
  });

  it('rejects NaN latitude', () => {
    const result = weatherService.validateCoordinates(NaN, 0);
    expect(result.isValid).toBe(false);
  });

  it('accepts boundary coordinates (90, 180)', () => {
    const result = weatherService.validateCoordinates(90, 180);
    expect(result.isValid).toBe(true);
  });

  it('accepts boundary coordinates (-90, -180)', () => {
    const result = weatherService.validateCoordinates(-90, -180);
    expect(result.isValid).toBe(true);
  });
});

// ============================================
// validateApiResponse
// ============================================
describe('WeatherService.validateApiResponse', () => {
  it('accepts a valid API response', () => {
    const result = weatherService.validateApiResponse(mockApiResponse.data);
    expect(result.isValid).toBe(true);
  });

  it('rejects null data', () => {
    const result = weatherService.validateApiResponse(null);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/No data/);
  });

  it('rejects undefined data', () => {
    const result = weatherService.validateApiResponse(undefined);
    expect(result.isValid).toBe(false);
  });

  it('rejects response without current object', () => {
    const result = weatherService.validateApiResponse({ latitude: 40 });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Missing current/);
  });

  it('rejects response with non-numeric temperature', () => {
    const result = weatherService.validateApiResponse({
      current: { temperature_2m: 'hot' },
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid temperature/);
  });
});

// ============================================
// fetchWeatherData
// ============================================
describe('WeatherService.fetchWeatherData', () => {
  it('fetches weather data from API and returns processed result', async () => {
    axios.get.mockResolvedValue(mockApiResponse);
    const result = await weatherService.fetchWeatherData(40.7983, -77.8599);

    expect(result.temperature).toBe(22.5);
    expect(result.humidity).toBe(65);
    expect(result.windSpeed).toBe(12.3);
    expect(result.weatherCode).toBe(2);
    expect(result.description).toBe('Partly cloudy');
    expect(result.fromCache).toBe(false);
    expect(result.rawData).toBeDefined();
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('returns cached data on second call with same coordinates', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    // First call - hits API
    const first = await weatherService.fetchWeatherData(41.0, -78.0);
    expect(first.fromCache).toBe(false);
    expect(axios.get).toHaveBeenCalledTimes(1);

    // Second call with same coords - should use cache
    const second = await weatherService.fetchWeatherData(41.0, -78.0);
    expect(second.fromCache).toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(1); // Still only 1 API call
  });

  it('throws on invalid coordinates', async () => {
    await expect(weatherService.fetchWeatherData(999, 0)).rejects.toThrow(
      /Invalid coordinates/
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('throws when API returns invalid response structure', async () => {
    axios.get.mockResolvedValue({ data: { latitude: 40 } });
    await expect(weatherService.fetchWeatherData(42.0, -79.0)).rejects.toThrow(
      /Invalid API response/
    );
  });

  it('handles API error response (e.g. 500)', async () => {
    const apiErr = new Error('Server error');
    apiErr.response = { status: 500, statusText: 'Internal Server Error' };
    axios.get.mockRejectedValue(apiErr);
    await expect(weatherService.fetchWeatherData(43.0, -80.0)).rejects.toThrow(
      /Weather API error: 500/
    );
  });

  it('handles network timeout', async () => {
    const netErr = new Error('Timeout');
    netErr.request = {}; // Axios sets request when no response received
    axios.get.mockRejectedValue(netErr);
    await expect(weatherService.fetchWeatherData(44.0, -81.0)).rejects.toThrow(
      /timeout or network error/
    );
  });

  it('maps unknown weather code to "Unknown"', async () => {
    const response = {
      data: {
        ...mockApiResponse.data,
        current: {
          ...mockApiResponse.data.current,
          weather_code: 999,
        },
      },
    };
    axios.get.mockResolvedValue(response);
    const result = await weatherService.fetchWeatherData(45.0, -82.0);
    expect(result.description).toBe('Unknown');
  });
});

// ============================================
// getCacheStats / clearCache
// ============================================
describe('WeatherService cache management', () => {
  it('getCacheStats returns stats object', () => {
    const stats = weatherService.getCacheStats();
    expect(stats).toBeDefined();
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
  });

  it('clearCache flushes all cached entries', async () => {
    axios.get.mockResolvedValue(mockApiResponse);

    // Populate cache
    await weatherService.fetchWeatherData(46.0, -83.0);
    expect(axios.get).toHaveBeenCalledTimes(1);

    // Clear cache
    weatherService.clearCache();

    // Next call should hit API again
    await weatherService.fetchWeatherData(46.0, -83.0);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
