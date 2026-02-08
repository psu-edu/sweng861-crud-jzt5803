import { NextResponse } from 'next/server';
import { ensureDb } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import { validateWeatherCoords } from '@/lib/validation';
import { externalApiLimiter } from '@/lib/rateLimit';
import weatherService from '@/lib/services/weatherService';

export async function GET(request) {
  try {
    const rateLimitResult = externalApiLimiter(request);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: 'Too many external API requests',
          message:
            'You have exceeded the rate limit for external API calls. Please try again later.',
          retryAfter: '15 minutes',
        },
        { status: 429 }
      );
    }

    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const validation = validateWeatherCoords(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const latitude = parseFloat(searchParams.get('latitude'));
    const longitude = parseFloat(searchParams.get('longitude'));

    const weatherData = await weatherService.fetchAndSaveWeatherData(
      user.id,
      latitude,
      longitude
    );

    return NextResponse.json({
      message: 'Weather data retrieved and saved successfully',
      data: {
        id: weatherData.id,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        weatherCode: weatherData.weatherCode,
        description: weatherData.description,
        fetchedAt: weatherData.fetchedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
