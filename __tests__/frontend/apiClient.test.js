/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

// We need to test apiClient in a jsdom environment where window/localStorage exist.
// Import after mocks are set up.

let apiGet, apiPost, apiPut, apiDelete, getToken, getJwtUser, ForbiddenError;

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  // Reset fetch mock
  global.fetch = jest.fn();
  // Re-import fresh module
  const mod = require('@/lib/apiClient');
  apiGet = mod.apiGet;
  apiPost = mod.apiPost;
  apiPut = mod.apiPut;
  apiDelete = mod.apiDelete;
  getToken = mod.getToken;
  getJwtUser = mod.getJwtUser;
  ForbiddenError = mod.ForbiddenError;
});

afterEach(() => {
  delete global.fetch;
});

describe('apiClient', () => {
  describe('getToken', () => {
    it('returns null when no JWT in localStorage', () => {
      expect(getToken()).toBeNull();
    });

    it('returns the stored JWT', () => {
      localStorage.setItem('jwt', 'test-token');
      expect(getToken()).toBe('test-token');
    });
  });

  describe('getJwtUser', () => {
    it('returns null when no token', () => {
      expect(getJwtUser()).toBeNull();
    });

    it('parses user from valid JWT payload', () => {
      // Create a fake JWT with payload { username: "alice", role: "admin" }
      const payload = btoa(
        JSON.stringify({ username: 'alice', role: 'admin' })
      );
      const fakeJwt = `header.${payload}.signature`;
      localStorage.setItem('jwt', fakeJwt);

      const user = getJwtUser();
      expect(user).toEqual({ username: 'alice', role: 'admin' });
    });

    it('returns null for malformed JWT', () => {
      localStorage.setItem('jwt', 'not-a-jwt');
      expect(getJwtUser()).toBeNull();
    });
  });

  describe('ForbiddenError', () => {
    it('creates error with default message', () => {
      const err = new ForbiddenError();
      expect(err.message).toBe(
        'You do not have permission to access this resource.'
      );
      expect(err.name).toBe('ForbiddenError');
      expect(err.status).toBe(403);
    });

    it('creates error with custom message', () => {
      const err = new ForbiddenError('Custom forbidden');
      expect(err.message).toBe('Custom forbidden');
    });
  });

  describe('request (via apiGet/apiPost/apiPut/apiDelete)', () => {
    it('apiGet sends GET request with Content-Type header', async () => {
      global.fetch.mockResolvedValue({ status: 200, ok: true });

      const result = await apiGet('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.status).toBe(200);
    });

    it('attaches Authorization header when JWT exists', async () => {
      localStorage.setItem('jwt', 'my-token');
      global.fetch.mockResolvedValue({ status: 200, ok: true });

      await apiGet('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token',
        },
      });
    });

    it('apiPost sends POST request with JSON body', async () => {
      global.fetch.mockResolvedValue({ status: 201, ok: true });

      await apiPost('/api/metrics', { name: 'Test' });

      expect(global.fetch).toHaveBeenCalledWith('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
    });

    it('apiPut sends PUT request with JSON body', async () => {
      global.fetch.mockResolvedValue({ status: 200, ok: true });

      await apiPut('/api/metrics/1', { name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith('/api/metrics/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
    });

    it('apiDelete sends DELETE request', async () => {
      global.fetch.mockResolvedValue({ status: 200, ok: true });

      await apiDelete('/api/metrics/1');

      expect(global.fetch).toHaveBeenCalledWith('/api/metrics/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('returns null and clears token on 401', async () => {
      localStorage.setItem('jwt', 'expired-token');

      global.fetch.mockResolvedValue({ status: 401 });

      const result = await apiGet('/api/protected');

      expect(result).toBeNull();
      expect(localStorage.getItem('jwt')).toBeNull();
      // window.location.href assignment triggers jsdom "not implemented" warning
      // but the redirect logic is still exercised
    });

    it('throws ForbiddenError on 403', async () => {
      global.fetch.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Not your resource' }),
      });

      await expect(apiGet('/api/metrics/123')).rejects.toThrow(ForbiddenError);
      await expect(apiGet('/api/metrics/123')).rejects.toThrow(
        'Not your resource'
      );
    });

    it('throws ForbiddenError with default message when 403 body parse fails', async () => {
      global.fetch.mockResolvedValue({
        status: 403,
        json: () => Promise.reject(new Error('parse error')),
      });

      await expect(apiGet('/api/test')).rejects.toThrow(ForbiddenError);
    });
  });
});
