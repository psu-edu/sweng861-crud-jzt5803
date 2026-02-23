import { NextResponse } from 'next/server';
import { ensureDb } from '@/lib/models';

/**
 * GET /api/health
 *
 * Comprehensive health check.
 * Always returns HTTP 200. If the database is unreachable the overall status
 * is "DEGRADED" and db is "DOWN", but the response code remains 200 so that
 * load-balancers that rely on this endpoint still receive a valid response.
 *
 * Response shape:
 * {
 *   status:    "UP" | "DEGRADED",
 *   db:        "UP" | "DOWN",
 *   uptime:    <seconds>,
 *   timestamp: <ISO-8601 string>,
 *   version:   "1.0.0"
 * }
 */
export async function GET() {
  let dbStatus = 'UP';

  try {
    await ensureDb();
  } catch (_err) {
    dbStatus = 'DOWN';
  }

  const overallStatus = dbStatus === 'UP' ? 'UP' : 'DEGRADED';

  return NextResponse.json(
    {
      status: overallStatus,
      db: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
