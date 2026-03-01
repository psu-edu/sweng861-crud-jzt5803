'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/apiClient';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(
        '/api/weather/preview?latitude=40.7983&longitude=-77.8599'
      );
      if (!res) {
        setError('Login to view weather');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      setWeather(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <svg
          className="animate-spin h-4 w-4 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Loading weather...</span>
      </div>
    );
  }
  if (error) return <p className="text-gray-400 text-sm">{error}</p>;
  if (!weather) return null;

  const tempF = Math.round((weather.temperature * 9) / 5 + 32);
  const windMph = Math.round(weather.windSpeed * 0.621371 * 10) / 10;

  return (
    <div className="space-y-2 text-sm">
      <p className="text-2xl font-bold text-gray-900">{tempF}°F</p>
      <p className="text-gray-600">{weather.description}</p>
      <div className="flex flex-wrap gap-x-4 text-gray-500">
        <span>Humidity: {weather.humidity}%</span>
        <span>Wind: {windMph} mph</span>
      </div>
      <p className="text-xs text-gray-400">Penn State University Park</p>
      <button
        onClick={fetchWeather}
        className="text-blue-600 hover:text-blue-800 text-xs mt-1"
      >
        Refresh
      </button>
    </div>
  );
}
