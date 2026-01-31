const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, _next, options) => {
    console.log(`[RateLimit] IP ${req.ip} exceeded rate limit on ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 * Helps prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    error: 'Too many authentication attempts',
    message:
      'You have made too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, _next, options) => {
    console.log(
      `[RateLimit] IP ${req.ip} exceeded auth rate limit on ${req.path}`
    );
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Strict rate limiter for external API calls (weather)
 * Limits: 30 requests per 15 minutes per IP
 * Prevents abuse of 3rd party API
 */
const externalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 external API calls per window
  message: {
    error: 'Too many external API requests',
    message:
      'You have exceeded the rate limit for external API calls. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    console.log(
      `[RateLimit] IP ${req.ip} exceeded external API rate limit on ${req.path}`
    );
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Create endpoint rate limiter
 * Limits: 20 create operations per 15 minutes per IP
 */
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 create operations per window
  message: {
    error: 'Too many create requests',
    message:
      'You have exceeded the rate limit for creating resources. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  externalApiLimiter,
  createLimiter,
};
