const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
let server;
let nextApp;
let testToken;
let testMetricId;

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Start Next.js test server programmatically
 */
async function startServer() {
  if (server) return;

  process.env.JWT_SECRET =
    'test_secret_key_minimum_32_characters_long_for_testing';
  process.env.NEXTAUTH_SECRET =
    'test_nextauth_secret_minimum_32_characters_long_xx';
  process.env.NEXTAUTH_URL = 'http://localhost:3001';
  process.env.NODE_ENV = 'test';

  const next = require('next');
  nextApp = next({ dev: true, dir: path.resolve(__dirname, '..') });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  return new Promise((resolve) => {
    server = http.createServer((req, res) => handle(req, res));
    server.listen(3001, () => {
      console.log('Test server started on port 3001');
      resolve();
    });
  });
}

/**
 * Stop test server
 */
async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(async () => {
        if (nextApp) {
          await nextApp.close();
        }
        console.log('Test server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ============================================
// All tests wrapped in a single describe for
// single server start/stop lifecycle
// ============================================
describe('Campus Analytics API', () => {
  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  // ============================================
  // Health Check Tests
  // ============================================
  describe('Health Check API', () => {
    it('should return health status', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.ok(res.body.timestamp);
      assert.ok(res.body.version);
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication API', () => {
    it('should register a new user', async () => {
      const username = `testuser_${Date.now()}`;
      const res = await makeRequest('POST', '/api/auth/register', {
        username,
        password: 'testpassword123',
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.userId);
      assert.strictEqual(res.body.message, 'User registered successfully');
    });

    it('should reject registration with short username', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        username: 'ab',
        password: 'testpassword123',
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should reject registration with short password', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        username: 'validusername',
        password: '12345',
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should reject registration with missing fields', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        username: 'testuser',
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should login with valid credentials', async () => {
      const username = `loginuser_${Date.now()}`;

      // First register
      await makeRequest('POST', '/api/auth/register', {
        username,
        password: 'testpassword123',
      });

      // Then login
      const res = await makeRequest('POST', '/api/auth/login', {
        username,
        password: 'testpassword123',
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.message, 'Login successful');
      testToken = res.body.token;
    });

    it('should reject login with invalid password', async () => {
      const username = `wrongpass_${Date.now()}`;

      // First register
      await makeRequest('POST', '/api/auth/register', {
        username,
        password: 'testpassword123',
      });

      // Then try to login with wrong password
      const res = await makeRequest('POST', '/api/auth/login', {
        username,
        password: 'wrongpassword',
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Invalid credentials');
    });

    it('should reject login with non-existent user', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        username: 'nonexistentuser',
        password: 'testpassword123',
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Invalid credentials');
    });

    it('should access protected route with valid token', async () => {
      const res = await makeRequest('GET', '/api/secure-data', null, testToken);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'This is protected data.');
      assert.ok(res.body.user);
    });

    it('should reject protected route without token', async () => {
      const res = await makeRequest('GET', '/api/secure-data');

      assert.strictEqual(res.status, 401);
    });

    it('should reject protected route with invalid token', async () => {
      const res = await makeRequest(
        'GET',
        '/api/secure-data',
        null,
        'invalid_token'
      );

      assert.strictEqual(res.status, 403);
    });
  });

  // ============================================
  // Metrics CRUD Tests
  // ============================================
  describe('Metrics CRUD API', () => {
    before(async () => {
      // Create a test user and get token
      const username = `metricsuser_${Date.now()}`;
      await makeRequest('POST', '/api/auth/register', {
        username,
        password: 'testpassword123',
      });
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        username,
        password: 'testpassword123',
      });
      testToken = loginRes.body.token;
    });

    it('should create a new metric', async () => {
      const res = await makeRequest(
        'POST',
        '/api/metrics',
        {
          name: 'Test Enrollment Metric',
          category: 'enrollment',
          value: 1500,
          unit: 'students',
          description: 'Test metric for unit testing',
          metadata: { campus: 'Main' },
        },
        testToken
      );

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.name, 'Test Enrollment Metric');
      assert.strictEqual(res.body.data.category, 'enrollment');
      assert.strictEqual(res.body.data.value, 1500);
      testMetricId = res.body.data.id;
    });

    it('should reject metric creation without authentication', async () => {
      const res = await makeRequest('POST', '/api/metrics', {
        name: 'Unauthorized Metric',
        category: 'enrollment',
        value: 100,
      });

      assert.strictEqual(res.status, 401);
    });

    it('should reject metric creation with invalid category', async () => {
      const res = await makeRequest(
        'POST',
        '/api/metrics',
        {
          name: 'Invalid Category Metric',
          category: 'invalid_category',
          value: 100,
        },
        testToken
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should reject metric creation with missing required fields', async () => {
      const res = await makeRequest(
        'POST',
        '/api/metrics',
        {
          name: 'Missing Fields Metric',
        },
        testToken
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should get all metrics for authenticated user', async () => {
      const res = await makeRequest('GET', '/api/metrics', null, testToken);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.pagination);
      assert.ok(res.body.pagination.total >= 1);
    });

    it('should get metrics with pagination', async () => {
      const res = await makeRequest(
        'GET',
        '/api/metrics?limit=5&offset=0',
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 5);
      assert.strictEqual(res.body.pagination.offset, 0);
    });

    it('should filter metrics by category', async () => {
      const res = await makeRequest(
        'GET',
        '/api/metrics?category=enrollment',
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      res.body.data.forEach((metric) => {
        assert.strictEqual(metric.category, 'enrollment');
      });
    });

    it('should get a specific metric by ID', async () => {
      const res = await makeRequest(
        'GET',
        `/api/metrics/${testMetricId}`,
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, testMetricId);
      assert.strictEqual(res.body.data.name, 'Test Enrollment Metric');
    });

    it('should return 404 for non-existent metric', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await makeRequest(
        'GET',
        `/api/metrics/${fakeId}`,
        null,
        testToken
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Metric not found');
    });

    it('should update a metric', async () => {
      const res = await makeRequest(
        'PUT',
        `/api/metrics/${testMetricId}`,
        {
          name: 'Updated Metric Name',
          value: 2000,
        },
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.name, 'Updated Metric Name');
      assert.strictEqual(res.body.data.value, 2000);
    });

    it('should reject update with invalid metric ID format', async () => {
      const res = await makeRequest(
        'PUT',
        '/api/metrics/invalid-id',
        {
          name: 'Test Update',
        },
        testToken
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should delete a metric', async () => {
      // Create a metric to delete
      const createRes = await makeRequest(
        'POST',
        '/api/metrics',
        {
          name: 'Metric to Delete',
          category: 'other',
          value: 100,
        },
        testToken
      );

      const metricToDelete = createRes.body.data.id;

      // Delete the metric
      const deleteRes = await makeRequest(
        'DELETE',
        `/api/metrics/${metricToDelete}`,
        null,
        testToken
      );

      assert.strictEqual(deleteRes.status, 200);
      assert.strictEqual(deleteRes.body.message, 'Metric deleted successfully');

      // Verify it's deleted
      const getRes = await makeRequest(
        'GET',
        `/api/metrics/${metricToDelete}`,
        null,
        testToken
      );

      assert.strictEqual(getRes.status, 404);
    });
  });

  // ============================================
  // Multi-tenancy Tests (BOLA Prevention)
  // ============================================
  describe('Multi-tenancy / BOLA Prevention', () => {
    let user1Token;
    let user2Token;
    let user1MetricId;

    before(async () => {
      // Create user 1
      const user1 = `user1_${Date.now()}`;
      await makeRequest('POST', '/api/auth/register', {
        username: user1,
        password: 'password123',
      });
      const login1 = await makeRequest('POST', '/api/auth/login', {
        username: user1,
        password: 'password123',
      });
      user1Token = login1.body.token;

      // Create user 2
      const user2 = `user2_${Date.now()}`;
      await makeRequest('POST', '/api/auth/register', {
        username: user2,
        password: 'password123',
      });
      const login2 = await makeRequest('POST', '/api/auth/login', {
        username: user2,
        password: 'password123',
      });
      user2Token = login2.body.token;

      // Create a metric for user 1
      const metricRes = await makeRequest(
        'POST',
        '/api/metrics',
        {
          name: 'User 1 Private Metric',
          category: 'financial',
          value: 50000,
        },
        user1Token
      );
      user1MetricId = metricRes.body.data.id;
    });

    it('should prevent user 2 from accessing user 1 metric', async () => {
      const res = await makeRequest(
        'GET',
        `/api/metrics/${user1MetricId}`,
        null,
        user2Token
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    it('should prevent user 2 from updating user 1 metric', async () => {
      const res = await makeRequest(
        'PUT',
        `/api/metrics/${user1MetricId}`,
        {
          name: 'Hacked Metric',
        },
        user2Token
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    it('should prevent user 2 from deleting user 1 metric', async () => {
      const res = await makeRequest(
        'DELETE',
        `/api/metrics/${user1MetricId}`,
        null,
        user2Token
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    it('user 1 should still be able to access their own metric', async () => {
      const res = await makeRequest(
        'GET',
        `/api/metrics/${user1MetricId}`,
        null,
        user1Token
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.id, user1MetricId);
    });

    it('user 2 metrics list should not include user 1 metrics', async () => {
      const res = await makeRequest('GET', '/api/metrics', null, user2Token);

      assert.strictEqual(res.status, 200);
      const user1MetricInList = res.body.data.find(
        (m) => m.id === user1MetricId
      );
      assert.strictEqual(user1MetricInList, undefined);
    });
  });

  // ============================================
  // Weather API Tests
  // ============================================
  describe('Weather API', () => {
    before(async () => {
      // Create a test user and get token
      const username = `weatheruser_${Date.now()}`;
      await makeRequest('POST', '/api/auth/register', {
        username,
        password: 'testpassword123',
      });
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        username,
        password: 'testpassword123',
      });
      testToken = loginRes.body.token;
    });

    it('should fetch weather data preview', async () => {
      // Penn State University Park coordinates
      const res = await makeRequest(
        'GET',
        '/api/weather/preview?latitude=40.7983&longitude=-77.8599',
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.temperature !== undefined);
      assert.ok(res.body.data.latitude);
      assert.ok(res.body.data.longitude);
    });

    it('should reject weather request with invalid coordinates', async () => {
      const res = await makeRequest(
        'GET',
        '/api/weather/preview?latitude=999&longitude=-77.8599',
        null,
        testToken
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'Validation failed');
    });

    it('should reject weather request without authentication', async () => {
      const res = await makeRequest(
        'GET',
        '/api/weather/preview?latitude=40.7983&longitude=-77.8599'
      );

      assert.strictEqual(res.status, 401);
    });

    it('should get weather history', async () => {
      const res = await makeRequest(
        'GET',
        '/api/weather/history',
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.pagination);
    });

    it('should get cache statistics', async () => {
      const res = await makeRequest(
        'GET',
        '/api/weather/cache/stats',
        null,
        testToken
      );

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should return proper error format for invalid login', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        username: 'nonexistent',
        password: 'wrong',
      });

      assert.strictEqual(res.status, 401);
      assert.ok(res.body.error);
    });
  });
});
