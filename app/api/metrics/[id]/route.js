import { NextResponse } from 'next/server';
import { ensureDb, Metric } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/apiErrors';
import { isValidUUID, validateMetricUpdate } from '@/lib/validation';
import eventEmitter from '@/lib/services/eventEmitter';

export async function GET(request, { params }) {
  try {
    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Validation failed', details: [{ msg: 'Invalid metric ID' }] },
        { status: 400 }
      );
    }

    const metric = await Metric.findByPk(id);
    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    if (metric.userId !== user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to access this metric',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: metric });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = validateMetricUpdate(body, id);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const metric = await Metric.findByPk(id);
    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    if (metric.userId !== user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to modify this metric',
        },
        { status: 403 }
      );
    }

    const { name, category, value, unit, description, metadata } = body;

    const changes = [];
    if (name !== undefined && name !== metric.name) changes.push('name');
    if (category !== undefined && category !== metric.category)
      changes.push('category');
    if (value !== undefined && value !== metric.value) changes.push('value');

    await metric.update({
      name: name ?? metric.name,
      category: category ?? metric.category,
      value: value ?? metric.value,
      unit: unit ?? metric.unit,
      description: description ?? metric.description,
      metadata: metadata ?? metric.metadata,
    });

    await eventEmitter.emitDomainEvent(
      'metric.updated',
      'Metric',
      metric.id,
      { id: metric.id, changes: changes.join(', ') || 'none' },
      user.id
    );

    return NextResponse.json({
      message: 'Metric updated successfully',
      data: metric,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureDb();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Validation failed', details: [{ msg: 'Invalid metric ID' }] },
        { status: 400 }
      );
    }

    const metric = await Metric.findByPk(id);
    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    if (metric.userId !== user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to delete this metric',
        },
        { status: 403 }
      );
    }

    const metricData = metric.toJSON();
    await metric.destroy();

    await eventEmitter.emitDomainEvent(
      'metric.deleted',
      'Metric',
      id,
      { id, name: metricData.name, category: metricData.category },
      user.id
    );

    return NextResponse.json({
      message: 'Metric deleted successfully',
      data: { id },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
