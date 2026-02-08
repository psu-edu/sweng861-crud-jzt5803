import { NextResponse } from 'next/server';
import { ensureDb, DomainEvent } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';

export async function GET(request) {
  try {
    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const { count, rows } = await DomainEvent.findAndCountAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      data: rows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + rows.length < count,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
