const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

async function getAuthUser(request) {
  // Check Bearer token (for API clients / Postman)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { id: decoded.id, username: decoded.username, role: decoded.role };
    } catch {
      return null;
    }
  }

  return null;
}

function signToken(user) {
  return jwt.sign(
    { username: user.username, id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { getAuthUser, signToken, JWT_SECRET };
