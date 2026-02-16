// Clear the global store before each import to ensure clean state
beforeEach(() => {
  globalThis._rateLimitStore = new Map();
});

describe('rateLimit', () => {
  function makeRequest(ip = '127.0.0.1') {
    return {
      headers: {
        get: (name) => {
          if (name === 'x-forwarded-for') return ip;
          return null;
        },
      },
    };
  }

  describe('getRateLimiter', () => {
    it('allows requests under the limit', () => {
      // Re-require after clearing global
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const { apiLimiter } = require('@/lib/rateLimit');

      const req = makeRequest('10.0.0.1');
      const result = apiLimiter(req);
      expect(result.limited).toBe(false);
    });

    it('blocks requests exceeding the limit', () => {
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const { getRateLimiter } = jest.requireActual('@/lib/rateLimit');

      // We can't easily access getRateLimiter since it's not exported.
      // Instead, test with authLimiter which has a low limit of 5.
      const { authLimiter } = require('@/lib/rateLimit');
      const req = makeRequest('10.0.0.2');

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const result = authLimiter(req);
        expect(result.limited).toBe(false);
      }

      // 6th request should be rate limited
      const result = authLimiter(req);
      expect(result.limited).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('tracks different IPs independently', () => {
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const { authLimiter } = require('@/lib/rateLimit');

      const req1 = makeRequest('192.168.1.1');
      const req2 = makeRequest('192.168.1.2');

      // Exhaust IP 1
      for (let i = 0; i < 5; i++) {
        authLimiter(req1);
      }
      const blocked = authLimiter(req1);
      expect(blocked.limited).toBe(true);

      // IP 2 should still be allowed
      const allowed = authLimiter(req2);
      expect(allowed.limited).toBe(false);
    });

    it('uses 127.0.0.1 when x-forwarded-for is absent', () => {
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const { authLimiter } = require('@/lib/rateLimit');

      const req = {
        headers: {
          get: () => null,
        },
      };

      const result = authLimiter(req);
      expect(result.limited).toBe(false);
    });

    it('extracts the first IP from x-forwarded-for with multiple IPs', () => {
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const { authLimiter } = require('@/lib/rateLimit');

      const req = {
        headers: {
          get: (name) => {
            if (name === 'x-forwarded-for') return '10.1.1.1, 10.2.2.2';
            return null;
          },
        },
      };

      // Exhaust based on 10.1.1.1
      for (let i = 0; i < 5; i++) {
        authLimiter(req);
      }
      const blocked = authLimiter(req);
      expect(blocked.limited).toBe(true);

      // A request from a different first IP should not be limited
      const req2 = {
        headers: {
          get: (name) => {
            if (name === 'x-forwarded-for') return '10.3.3.3, 10.2.2.2';
            return null;
          },
        },
      };
      const allowed = authLimiter(req2);
      expect(allowed.limited).toBe(false);
    });
  });

  describe('pre-configured limiters', () => {
    it('exports apiLimiter, authLimiter, externalApiLimiter, createLimiter', () => {
      delete require.cache[require.resolve('@/lib/rateLimit')];
      const mod = require('@/lib/rateLimit');
      expect(typeof mod.apiLimiter).toBe('function');
      expect(typeof mod.authLimiter).toBe('function');
      expect(typeof mod.externalApiLimiter).toBe('function');
      expect(typeof mod.createLimiter).toBe('function');
    });
  });
});
