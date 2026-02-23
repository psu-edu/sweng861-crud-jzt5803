'use strict';

/**
 * Lightweight in-memory metrics module — no external dependencies.
 *
 * Uses a global singleton (global.__campusMetrics) so the state survives
 * Next.js hot-reloads in development.
 *
 * Exposes Prometheus text format via getMetricsText().
 */

const HISTOGRAM_BUCKETS = [50, 100, 200, 500, 1000, 2000, Infinity];

/**
 * Initialize a fresh metrics state object.
 * @returns {Object}
 */
function initializeMetrics() {
  return {
    // http_requests_total{method, route, status} counter
    httpRequestsTotal: {},

    // http_request_duration_ms{method, route} histogram
    // Each key maps to { buckets: {le: count}, sum, count }
    httpRequestDuration: {},

    // metrics_created_total counter (scalar)
    metricsCreatedTotal: 0,

    // auth_logins_total{status} counter
    authLoginsTotal: {},
  };
}

// Singleton — survives Next.js hot-reloads in development
if (!global.__campusMetrics) {
  global.__campusMetrics = initializeMetrics();
}

const state = global.__campusMetrics;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a label string for Prometheus format.
 * @param {Object} labels  e.g. { method: 'GET', route: '/api/metrics' }
 * @returns {string}       e.g. 'method="GET",route="/api/metrics"'
 */
function labelsToString(labels) {
  return Object.entries(labels)
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
}

/**
 * Safely increment a counter stored in a plain object keyed by label string.
 * @param {Object} store
 * @param {string} labelStr
 * @param {number} [amount]
 */
function incrementCounter(store, labelStr, amount = 1) {
  store[labelStr] = (store[labelStr] || 0) + amount;
}

/**
 * Record a value into a histogram entry.
 * @param {Object} store
 * @param {string} labelStr
 * @param {number} value
 */
function recordHistogram(store, labelStr, value) {
  if (!store[labelStr]) {
    // Initialize bucket counts; keys are the upper bound values
    const buckets = {};
    for (const b of HISTOGRAM_BUCKETS) {
      buckets[b] = 0;
    }
    store[labelStr] = { buckets, sum: 0, count: 0 };
  }
  const entry = store[labelStr];
  for (const b of HISTOGRAM_BUCKETS) {
    if (value <= b) {
      entry.buckets[b] += 1;
    }
  }
  entry.sum += value;
  entry.count += 1;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record an HTTP request.
 * @param {string} method      HTTP method (e.g. 'GET')
 * @param {string} route       Route pattern (e.g. '/api/metrics')
 * @param {number} statusCode  HTTP status code (e.g. 200)
 * @param {number} durationMs  Request duration in milliseconds
 */
function recordRequest(method, route, statusCode, durationMs) {
  const counterKey = labelsToString({
    method,
    route,
    status: String(statusCode),
  });
  incrementCounter(state.httpRequestsTotal, counterKey);

  const durationKey = labelsToString({ method, route });
  recordHistogram(state.httpRequestDuration, durationKey, durationMs);
}

/**
 * Increment the metrics_created_total counter.
 */
function recordMetricCreated() {
  state.metricsCreatedTotal += 1;
}

/**
 * Record a login attempt.
 * @param {boolean} success  true for successful logins, false for failures
 */
function recordLogin(success) {
  const labelStr = labelsToString({ status: success ? 'success' : 'failure' });
  incrementCounter(state.authLoginsTotal, labelStr);
}

/**
 * Render all collected metrics in Prometheus text format (exposition format 0.0.4).
 * @returns {string}
 */
function getMetricsText() {
  const lines = [];

  // --- http_requests_total ---
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  for (const [labelStr, value] of Object.entries(state.httpRequestsTotal)) {
    lines.push(`http_requests_total{${labelStr}} ${value}`);
  }

  // --- http_request_duration_ms ---
  lines.push(
    '# HELP http_request_duration_ms HTTP request duration in milliseconds'
  );
  lines.push('# TYPE http_request_duration_ms histogram');
  for (const [labelStr, entry] of Object.entries(state.httpRequestDuration)) {
    // Cumulative bucket counts
    let cumulative = 0;
    for (const b of HISTOGRAM_BUCKETS) {
      cumulative += entry.buckets[b];
      const leLabel = b === Infinity ? '+Inf' : String(b);
      lines.push(
        `http_request_duration_ms_bucket{${labelStr},le="${leLabel}"} ${cumulative}`
      );
    }
    lines.push(`http_request_duration_ms_sum{${labelStr}} ${entry.sum}`);
    lines.push(`http_request_duration_ms_count{${labelStr}} ${entry.count}`);
  }

  // --- metrics_created_total ---
  lines.push(
    '# HELP metrics_created_total Total number of metric records created'
  );
  lines.push('# TYPE metrics_created_total counter');
  lines.push(`metrics_created_total ${state.metricsCreatedTotal}`);

  // --- auth_logins_total ---
  lines.push('# HELP auth_logins_total Total number of authentication logins');
  lines.push('# TYPE auth_logins_total counter');
  for (const [labelStr, value] of Object.entries(state.authLoginsTotal)) {
    lines.push(`auth_logins_total{${labelStr}} ${value}`);
  }

  // Prometheus text format requires a trailing newline
  return lines.join('\n') + '\n';
}

/**
 * Reset all metrics to their initial state (intended for use in tests).
 */
function resetMetrics() {
  const fresh = initializeMetrics();
  state.httpRequestsTotal = fresh.httpRequestsTotal;
  state.httpRequestDuration = fresh.httpRequestDuration;
  state.metricsCreatedTotal = fresh.metricsCreatedTotal;
  state.authLoginsTotal = fresh.authLoginsTotal;
}

module.exports = {
  recordRequest,
  recordMetricCreated,
  recordLogin,
  getMetricsText,
  resetMetrics,
};
