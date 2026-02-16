const { ApiError, handleApiError } = require('@/lib/apiErrors');

// ============================================
// ApiError class
// ============================================
describe('ApiError', () => {
  it('creates an error with status code and message', () => {
    const err = new ApiError(400, 'Bad request');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeNull();
    expect(err).toBeInstanceOf(Error);
  });

  it('stores details when provided', () => {
    const details = [{ field: 'name', message: 'required' }];
    const err = new ApiError(400, 'Validation', details);
    expect(err.details).toEqual(details);
  });

  describe('static factory methods', () => {
    it('badRequest creates a 400 error', () => {
      const err = ApiError.badRequest('Missing field', [{ field: 'name' }]);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Missing field');
      expect(err.details).toEqual([{ field: 'name' }]);
    });

    it('unauthorized creates a 401 error', () => {
      const err = ApiError.unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
    });

    it('unauthorized accepts a custom message', () => {
      const err = ApiError.unauthorized('Token expired');
      expect(err.message).toBe('Token expired');
    });

    it('forbidden creates a 403 error', () => {
      const err = ApiError.forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Forbidden');
    });

    it('notFound creates a 404 error', () => {
      const err = ApiError.notFound('Metric not found');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Metric not found');
    });

    it('notFound uses default message', () => {
      const err = ApiError.notFound();
      expect(err.message).toBe('Resource not found');
    });

    it('conflict creates a 409 error', () => {
      const err = ApiError.conflict('Duplicate', [{ field: 'username' }]);
      expect(err.statusCode).toBe(409);
      expect(err.details).toEqual([{ field: 'username' }]);
    });

    it('tooManyRequests creates a 429 error', () => {
      const err = ApiError.tooManyRequests();
      expect(err.statusCode).toBe(429);
      expect(err.message).toBe('Too many requests');
    });

    it('internal creates a 500 error', () => {
      const err = ApiError.internal();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Internal server error');
    });
  });
});

// ============================================
// handleApiError
// ============================================
describe('handleApiError', () => {
  // Mock console.error to avoid noisy output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it('handles ApiError and returns correct status + body', async () => {
    const err = ApiError.notFound('Metric not found');
    const response = handleApiError(err);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Metric not found');
  });

  it('handles ApiError with details', async () => {
    const err = ApiError.badRequest('Validation failed', [
      { field: 'name', message: 'required' },
    ]);
    const response = handleApiError(err);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.details).toEqual([{ field: 'name', message: 'required' }]);
  });

  it('handles SequelizeValidationError', async () => {
    const err = new Error('Validation');
    err.name = 'SequelizeValidationError';
    err.errors = [{ path: 'name', message: 'cannot be null' }];
    const response = handleApiError(err);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation error');
    expect(body.details).toEqual([
      { field: 'name', message: 'cannot be null' },
    ]);
  });

  it('handles SequelizeUniqueConstraintError', async () => {
    const err = new Error('Unique');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = [{ path: 'username', message: 'must be unique' }];
    const response = handleApiError(err);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('Duplicate entry');
  });

  it('handles SequelizeDatabaseError', async () => {
    const err = new Error('DB error');
    err.name = 'SequelizeDatabaseError';
    const response = handleApiError(err);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Database error');
  });

  it('handles JsonWebTokenError', async () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    const response = handleApiError(err);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid token');
  });

  it('handles TokenExpiredError', async () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    const response = handleApiError(err);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Token expired');
  });

  it('handles Axios errors', async () => {
    const err = new Error('Network error');
    err.isAxiosError = true;
    err.response = { status: 502, data: { message: 'Bad gateway' } };
    const response = handleApiError(err);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('External API error');
  });

  it('handles Axios error without response', async () => {
    const err = new Error('Timeout');
    err.isAxiosError = true;
    err.response = null;
    const response = handleApiError(err);
    expect(response.status).toBe(502);
  });

  it('handles generic errors with 500 status', async () => {
    const err = new Error('Something broke');
    const response = handleApiError(err);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Server error');
  });

  it('includes stack trace in development mode', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev error');
    const response = handleApiError(err);
    const body = await response.json();
    expect(body.stack).toBeDefined();
    process.env.NODE_ENV = origEnv;
  });

  it('hides message details in production mode', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('Secret details');
    const response = handleApiError(err);
    const body = await response.json();
    expect(body.message).toBe('An unexpected error occurred');
    expect(body.stack).toBeUndefined();
    process.env.NODE_ENV = origEnv;
  });
});
