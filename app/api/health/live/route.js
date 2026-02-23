import { NextResponse } from 'next/server';

/**
 * GET /api/health/live
 *
 * Liveness probe — is the process alive?
 * Always returns HTTP 200 as long as the Node.js process is running.
 *
 * Response shape:
 * { status: "UP" }
 */
export async function GET() {
  return NextResponse.json({ status: 'UP' }, { status: 200 });
}
