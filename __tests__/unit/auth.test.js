const jwt = require('jsonwebtoken');

// Set test secret before requiring auth module
process.env.JWT_SECRET =
  'test_secret_key_minimum_32_characters_long_for_testing';

const { getAuthUser, signToken, JWT_SECRET } = require('@/lib/auth');

// ============================================
// JWT_SECRET
// ============================================
describe('JWT_SECRET', () => {
  it('uses the environment variable when set', () => {
    expect(JWT_SECRET).toBe(
      'test_secret_key_minimum_32_characters_long_for_testing'
    );
  });
});

// ============================================
// signToken
// ============================================
describe('signToken', () => {
  const testUser = { id: 1, username: 'alice', role: 'user' };

  it('returns a valid JWT string', () => {
    const token = signToken(testUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes username, id, and role in the payload', () => {
    const token = signToken(testUser);
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.username).toBe('alice');
    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe('user');
  });

  it('sets a 1-hour expiration', () => {
    const token = signToken(testUser);
    const decoded = jwt.verify(token, JWT_SECRET);
    // exp - iat should be 3600 seconds (1 hour)
    expect(decoded.exp - decoded.iat).toBe(3600);
  });

  it('produces different tokens for different users', () => {
    const token1 = signToken(testUser);
    const token2 = signToken({ id: 2, username: 'bob', role: 'admin' });
    expect(token1).not.toBe(token2);
  });

  it('encodes admin role correctly', () => {
    const token = signToken({ id: 2, username: 'admin', role: 'admin' });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.role).toBe('admin');
  });
});

// ============================================
// getAuthUser
// ============================================
describe('getAuthUser', () => {
  function makeRequest(authHeader) {
    return {
      headers: {
        get: (name) => {
          if (name.toLowerCase() === 'authorization') return authHeader;
          return null;
        },
      },
    };
  }

  it('returns user object from a valid Bearer token', async () => {
    const token = signToken({ id: 1, username: 'alice', role: 'user' });
    const req = makeRequest(`Bearer ${token}`);
    const user = await getAuthUser(req);
    expect(user).toEqual({ id: 1, username: 'alice', role: 'user' });
  });

  it('returns null when no authorization header is present', async () => {
    const req = makeRequest(null);
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null when authorization header is empty', async () => {
    const req = makeRequest('');
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null for a non-Bearer scheme', async () => {
    const req = makeRequest('Basic dXNlcjpwYXNz');
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null for an invalid JWT', async () => {
    const req = makeRequest('Bearer invalid.token.here');
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null for an expired token', async () => {
    const expired = jwt.sign(
      { id: 1, username: 'alice', role: 'user' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = makeRequest(`Bearer ${expired}`);
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const badToken = jwt.sign(
      { id: 1, username: 'alice', role: 'user' },
      'wrong_secret_key_that_does_not_match_at_all_1234',
      { expiresIn: '1h' }
    );
    const req = makeRequest(`Bearer ${badToken}`);
    const user = await getAuthUser(req);
    expect(user).toBeNull();
  });

  it('returns null when Bearer prefix is missing the space', async () => {
    const token = signToken({ id: 1, username: 'alice', role: 'user' });
    const req = makeRequest(`Bearer${token}`);
    const user = await getAuthUser(req);
    // "Bearer<token>" does not start with "Bearer " so it should return null
    expect(user).toBeNull();
  });
});
