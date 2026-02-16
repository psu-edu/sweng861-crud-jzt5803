const { NextResponse } = require('next/server');

// Mock next-auth/jwt
let mockToken = null;
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(() => Promise.resolve(mockToken)),
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const headers = new Map();
  const mockResponse = {
    headers: {
      set: jest.fn((key, val) => headers.set(key, val)),
      get: (key) => headers.get(key),
    },
  };
  return {
    NextResponse: {
      next: jest.fn(() => mockResponse),
      redirect: jest.fn((url) => ({ redirectUrl: url.toString() })),
      json: jest.fn((body, init) => ({ body, status: init?.status })),
    },
  };
});

// Import after mocks
const { middleware } = require('@/middleware');
const { getToken } = require('next-auth/jwt');

function createMockRequest(pathname) {
  return {
    nextUrl: {
      pathname,
    },
    url: `http://localhost:3000${pathname}`,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockToken = null;
});

describe('Middleware', () => {
  describe('security headers', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const req = createMockRequest('/');
      const res = await middleware(req);
      expect(res.headers.set).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      );
    });

    it('sets X-Frame-Options: DENY', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      expect(NextResponse.next().headers.set).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY'
      );
    });

    it('sets X-XSS-Protection header', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      expect(NextResponse.next().headers.set).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block'
      );
    });

    it('sets Strict-Transport-Security header', async () => {
      const req = createMockRequest('/');
      await middleware(req);
      expect(NextResponse.next().headers.set).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    });
  });

  describe('route protection', () => {
    it('redirects unauthenticated user from /metrics to /login', async () => {
      mockToken = null;
      const req = createMockRequest('/metrics');
      const res = await middleware(req);

      expect(getToken).toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/metrics');
    });

    it('redirects unauthenticated user from /metrics/new to /login', async () => {
      mockToken = null;
      const req = createMockRequest('/metrics/new');
      await middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe('/login');
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/metrics/new');
    });

    it('redirects unauthenticated user from /dashboard to /login', async () => {
      mockToken = null;
      const req = createMockRequest('/dashboard');
      await middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('allows authenticated user to access /metrics', async () => {
      mockToken = { sub: 'user-1', name: 'Alice' };
      const req = createMockRequest('/metrics');
      const res = await middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(res.headers).toBeDefined();
    });

    it('allows authenticated user to access /metrics/:id', async () => {
      mockToken = { sub: 'user-1' };
      const req = createMockRequest('/metrics/abc-123');
      const res = await middleware(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('does NOT check auth for /login', async () => {
      const req = createMockRequest('/login');
      await middleware(req);

      expect(getToken).not.toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('does NOT check auth for / (home)', async () => {
      const req = createMockRequest('/');
      await middleware(req);

      expect(getToken).not.toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('does NOT check auth for /api routes', async () => {
      const req = createMockRequest('/api/metrics');
      await middleware(req);

      expect(getToken).not.toHaveBeenCalled();
    });

    it('preserves callbackUrl in redirect', async () => {
      mockToken = null;
      const req = createMockRequest('/metrics/abc-123/edit');
      await middleware(req);

      const redirectUrl = NextResponse.redirect.mock.calls[0][0];
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe(
        '/metrics/abc-123/edit'
      );
    });
  });
});
