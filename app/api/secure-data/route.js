import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'This is protected data.',
      user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
