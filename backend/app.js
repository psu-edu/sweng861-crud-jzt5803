require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// Database and models
const { User, initDb } = require('./database');

// Middleware
const authenticateToken = require('./authMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const {
  apiLimiter,
  authLimiter,
  externalApiLimiter,
  createLimiter,
} = require('./middleware/rateLimiter');

// Routes
const metricsRouter = require('./routes/metrics');
const weatherRouter = require('./routes/weather');

// Swagger documentation
const swaggerSpec = require('./config/swagger');

// Passport configuration
const session = require('express-session');
const passport = require('passport');
require('./passportConfig');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session setup (required for passport state)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

// Initialize Database
initDb();

// ============================================
// API Documentation (Swagger)
// ============================================
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Campus Analytics API Documentation',
  })
);

// Serve swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================
// Public Routes
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ============================================
// Authentication Routes
// ============================================

// Google OAuth Flow
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  }),
  (req, res) => {
    // Successful authentication, issue JWT
    const user = req.user;
    const token = jwt.sign(
      { username: user.username, id: user.id, role: user.role },
      JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    // Redirect to frontend with token
    res.redirect(`/?token=${token}`);
  }
);

// Traditional registration
app.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ message: 'Username and password are required' }],
      });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ message: 'Username must be between 3 and 50 characters' }],
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ message: 'Password must be at least 6 characters' }],
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased cost factor
    const user = await User.create({
      username,
      password: hashedPassword,
      role: 'user',
    });

    console.log(`[Auth] New user registered: ${username}`);

    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
    });
  } catch (error) {
    next(error);
  }
});

// Traditional login
app.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username and password are required',
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'This account uses OAuth authentication',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`[Auth] Failed login attempt for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: user.username, id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`[Auth] User logged in: ${username}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Protected route example
app.get('/secure-data', authenticateToken, (req, res) => {
  res.json({
    message: 'This is protected data.',
    user: req.user,
  });
});

// ============================================
// API Routes with Rate Limiting
// ============================================

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Metrics CRUD routes
app.use('/api/metrics', metricsRouter);

// Apply stricter rate limiting for create operations
app.post('/api/metrics', createLimiter);

// Weather API routes with external API rate limiting
app.use('/api/weather', externalApiLimiter, weatherRouter);

// ============================================
// Events endpoint (for viewing domain events)
// ============================================
app.get('/api/events', authenticateToken, async (req, res, next) => {
  try {
    const { DomainEvent } = require('./database');
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const { count, rows } = await DomainEvent.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + rows.length < count,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Error Handling
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Server Start
// ============================================
if (require.main === module) {
  app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║             Campus Analytics API Server                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running on port ${port}                                   ║
║  API Documentation: http://localhost:${port}/api-docs             ║
║  Health Check: http://localhost:${port}/health                    ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
