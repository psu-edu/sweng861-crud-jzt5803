import { getMetricsText } from '@/lib/metrics';

/**
 * GET /api/prometheus
 *
 * Exposes collected metrics in Prometheus text exposition format (0.0.4).
 * Intended to be scraped by a Prometheus server or compatible tool.
 */
export async function GET() {
  const metrics = getMetricsText();
  return new Response(metrics, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
