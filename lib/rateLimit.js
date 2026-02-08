const globalForRateLimit = globalThis;

if (!globalForRateLimit._rateLimitStore) {
  globalForRateLimit._rateLimitStore = new Map();
}

const store = globalForRateLimit._rateLimitStore;

function getRateLimiter(name, windowMs, max) {
  return function checkRateLimit(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const key = `${name}:${ip}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now - record.windowStart > windowMs) {
      record = { windowStart: now, count: 0 };
      store.set(key, record);
    }

    record.count++;

    if (record.count > max) {
      console.log(`[RateLimit] IP ${ip} exceeded ${name} rate limit`);
      return {
        limited: true,
        retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000),
      };
    }

    return { limited: false };
  };
}

const apiLimiter = getRateLimiter('api', 15 * 60 * 1000, 100);
const authLimiter = getRateLimiter('auth', 15 * 60 * 1000, 5);
const externalApiLimiter = getRateLimiter('external', 15 * 60 * 1000, 30);
const createLimiter = getRateLimiter('create', 15 * 60 * 1000, 20);

module.exports = {
  apiLimiter,
  authLimiter,
  externalApiLimiter,
  createLimiter,
};
