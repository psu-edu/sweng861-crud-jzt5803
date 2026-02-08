import { NextResponse } from 'next/server';
import { ensureDb, Metric } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import { validateMetricCreate, VALID_CATEGORIES } from '@/lib/validation';
import { apiLimiter, createLimiter } from '@/lib/rateLimit';
import eventEmitter from '@/lib/services/eventEmitter';

export async function GET(request) {
  try {
    const rateLimitResult = apiLimiter(request);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const category = searchParams.get('category');

    const whereClause = { userId: user.id };
    if (category && VALID_CATEGORIES.includes(category)) {
      whereClause.category = category;
    }

    const { count, rows } = await Metric.findAndCountAll({
      where: whereClause,
      order: [['recordedAt', 'DESC']],
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

export async function POST(request) {
  try {
    const rateLimitResult = createLimiter(request);
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: 'Too many create requests',
          message:
            'You have exceeded the rate limit for creating resources. Please try again later.',
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

    const body = await request.json();
    const validation = validateMetricCreate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { name, category, value, unit, description, metadata, recordedAt } =
      body;

    const metric = await Metric.create({
      userId: user.id,
      name: name.trim(),
      category,
      value: Number(value),
      unit: unit || 'count',
      description,
      metadata: metadata || {},
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    });

    await eventEmitter.emitDomainEvent(
      'metric.created',
      'Metric',
      metric.id,
      { name, category, value, unit },
      user.id
    );

    return NextResponse.json(
      { message: 'Metric created successfully', data: metric },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
