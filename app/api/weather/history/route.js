import { NextResponse } from 'next/server';
import { ensureDb } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import weatherService from '@/lib/services/weatherService';

export async function GET(request) {
  try {
    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const history = await weatherService.getUserWeatherHistory(user.id, {
      limit,
      offset,
    });

    return NextResponse.json(history);
  } catch (error) {
    return handleApiError(error);
  }
}
