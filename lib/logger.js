'use strict';

/**
 * Structured JSON logger
 *
 * Outputs JSON to stdout (info/debug) or stderr (warn/error).
 * Sensitive keys are automatically filtered from meta before logging.
 *
 * Example output:
 * {"timestamp":"2025-01-15T10:30:00.000Z","level":"info","message":"User logged in","username":"alice","requestId":"abc123"}
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
]);

/**
 * Remove sensitive keys from a meta object before logging.
 * @param {Object} meta
 * @returns {Object} sanitized copy of meta
 */
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return meta;
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Build a log entry object.
 * @param {string} level
 * @param {string} message
 * @param {Object} [meta]
 * @returns {Object}
 */
function buildEntry(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeMeta(meta),
  };
  return entry;
}

const logger = {
  /**
   * Log at INFO level — written to stdout.
   * @param {string} message
   * @param {Object} [meta]
   */
  info(message, meta) {
    const entry = buildEntry('info', message, meta);
    console.log(JSON.stringify(entry));
  },

  /**
   * Log at WARN level — written to stderr.
   * @param {string} message
   * @param {Object} [meta]
   */
  warn(message, meta) {
    const entry = buildEntry('warn', message, meta);
    console.error(JSON.stringify(entry));
  },

  /**
   * Log at ERROR level — written to stderr.
   * @param {string} message
   * @param {Object} [meta]
   */
  error(message, meta) {
    const entry = buildEntry('error', message, meta);
    console.error(JSON.stringify(entry));
  },

  /**
   * Log at DEBUG level — written to stdout.
   * Suppressed when NODE_ENV is "production".
   * @param {string} message
   * @param {Object} [meta]
   */
  debug(message, meta) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const entry = buildEntry('debug', message, meta);
    console.log(JSON.stringify(entry));
  },
};

module.exports = logger;
