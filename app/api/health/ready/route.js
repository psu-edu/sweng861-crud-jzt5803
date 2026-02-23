import { NextResponse } from 'next/server';
import { ensureDb } from '@/lib/models';

/**
 * GET /api/health/ready
 *
 * Readiness probe — is the application ready to serve traffic?
 * Returns HTTP 200 when the database is reachable, HTTP 503 otherwise.
 *
 * Response shape:
 * { status: "UP" | "DOWN", db: "UP" | "DOWN" }
 */
export async function GET() {
  let dbStatus = 'UP';

  try {
    await ensureDb();
  } catch (_err) {
    dbStatus = 'DOWN';
  }

  const overallStatus = dbStatus === 'UP' ? 'UP' : 'DOWN';
  const httpStatus = overallStatus === 'UP' ? 200 : 503;

  return NextResponse.json(
    { status: overallStatus, db: dbStatus },
    { status: httpStatus }
  );
}
