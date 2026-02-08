import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import weatherService from '@/lib/services/weatherService';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = weatherService.getCacheStats();
    return NextResponse.json({
      message: 'Cache statistics',
      data: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
