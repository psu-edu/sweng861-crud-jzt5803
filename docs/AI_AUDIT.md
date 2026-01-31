# AI-Assisted Development Audit Report

## Campus Analytics API - Week 3 Backend Development

**Author:** Jomar Thomas Almonte
**Date:** January 2026
**Course:** SWENG 861 - Software Construction

---

## Overview

This document details the AI-assisted development process used for building the Campus Analytics API backend, including specific instances where AI suggestions were reviewed, modified, or rejected to ensure security and correctness.

---

## AI Audit Findings

### Audit #1: BOLA/IDOR Vulnerability Prevention

**Initial AI Suggestion:**
When generating the initial metrics retrieval endpoint, the AI suggested:

```javascript
// AI-generated code (INSECURE)
router.get('/:id', authenticateToken, async (req, res) => {
  const metric = await Metric.findByPk(req.params.id);
  if (!metric) {
    return res.status(404).json({ error: 'Metric not found' });
  }
  res.json({ data: metric });
});
```

**Security Issue Identified:**
This code is vulnerable to **Broken Object Level Authorization (BOLA/IDOR)**. Any authenticated user could access any metric by guessing or enumerating IDs, regardless of ownership.

**Fix Applied:**
Added explicit ownership verification:

```javascript
// SECURE implementation
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const metric = await Metric.findByPk(req.params.id);

  if (!metric) {
    return res.status(404).json({ error: 'Metric not found' });
  }

  // Ownership check (prevents BOLA/IDOR)
  if (metric.userId !== userId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this metric',
    });
  }

  res.json({ data: metric });
});
```

**Location:** `backend/routes/metrics.js:135-156`

---

### Audit #2: JWT Token Payload Security

**Initial AI Suggestion:**
The AI initially suggested including the user's password hash in the JWT payload:

```javascript
// AI-generated code (INSECURE)
const token = jwt.sign(
  {
    username: user.username,
    id: user.id,
    password: user.password, // NEVER DO THIS!
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);
```

**Security Issue Identified:**
Including sensitive data like password hashes in JWT tokens is a severe security vulnerability. JWTs are base64-encoded (not encrypted) and can be easily decoded by anyone.

**Fix Applied:**
Only include minimal, non-sensitive user identification data:

```javascript
// SECURE implementation
const token = jwt.sign(
  {
    username: user.username,
    id: user.id,
    role: user.role, // Safe: only role for authorization
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);
```

**Location:** `backend/app.js:142-148`

---

### Audit #3: SQL Injection via Raw Queries

**Initial AI Suggestion:**
For filtering metrics by category, the AI suggested using string interpolation:

```javascript
// AI-generated code (INSECURE)
const metrics = await sequelize.query(
  `SELECT * FROM Metrics WHERE category = '${req.query.category}'`
);
```

**Security Issue Identified:**
This code is vulnerable to **SQL Injection**. An attacker could inject malicious SQL through the category parameter.

**Fix Applied:**
Used Sequelize's parameterized queries with the ORM:

```javascript
// SECURE implementation
const whereClause = { userId };
if (category) {
  whereClause.category = category;
}

const { count, rows } = await Metric.findAndCountAll({
  where: whereClause,
  order: [['recordedAt', 'DESC']],
  limit,
  offset,
});
```

**Location:** `backend/routes/metrics.js:95-103`

---

### Audit #4: Missing Input Validation

**Initial AI Suggestion:**
The AI generated CRUD endpoints without input validation:

```javascript
// AI-generated code (INSECURE)
router.post('/', authenticateToken, async (req, res) => {
  const { name, category, value } = req.body;
  const metric = await Metric.create({ name, category, value });
  res.json(metric);
});
```

**Security Issue Identified:**
No validation of input data could lead to:

- Invalid data in database
- Potential XSS through stored payloads
- Application crashes from unexpected data types

**Fix Applied:**
Implemented comprehensive validation using express-validator:

```javascript
// SECURE implementation
const metricValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 255 })
      .withMessage('Name must be at most 255 characters'),
    body('category')
      .isIn(['enrollment', 'facilities', 'academic', 'financial', 'other'])
      .withMessage('Invalid category'),
    body('value').isFloat().withMessage('Value must be a number'),
    // ... additional validation
  ],
};

router.post(
  '/',
  authenticateToken,
  metricValidation.create,
  validate,
  async (req, res) => {
    // Safe to use validated data
  }
);
```

**Location:** `backend/routes/metrics.js:22-71`

---

### Audit #5: Insecure Default JWT Secret

**Initial AI Suggestion:**
The AI used a hardcoded secret in the code:

```javascript
// AI-generated code (INSECURE)
const JWT_SECRET = 'my_super_secret_key_12345';
```

**Security Issue Identified:**
Hardcoded secrets in source code are a major security risk. If the code is committed to version control, the secret is exposed.

**Fix Applied:**
Use environment variables with a warning for development defaults:

```javascript
// SECURE implementation
const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

// Also added warning in documentation
// In production, ALWAYS set JWT_SECRET environment variable
```

**Location:** `backend/app.js:83`

---

### Audit #6: Missing Rate Limiting on Authentication

**Initial AI Suggestion:**
The AI didn't include rate limiting on authentication endpoints, making them vulnerable to brute-force attacks.

**Fix Applied:**
Implemented strict rate limiting on authentication endpoints:

```javascript
// SECURE implementation
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later.',
  },
  skipSuccessfulRequests: true,
});

app.post('/login', authLimiter, async (req, res) => { ... });
app.post('/register', authLimiter, async (req, res) => { ... });
```

**Location:** `backend/middleware/rateLimiter.js:24-47`

---

## Summary of Security Measures Implemented

| Vulnerability     | Mitigation                                    | Status      |
| ----------------- | --------------------------------------------- | ----------- |
| BOLA/IDOR         | Ownership checks on all protected resources   | Implemented |
| SQL Injection     | Parameterized queries via Sequelize ORM       | Implemented |
| JWT Security      | Minimal payload, environment-based secrets    | Implemented |
| Input Validation  | express-validator on all endpoints            | Implemented |
| Rate Limiting     | Tiered rate limits for API and auth           | Implemented |
| XSS Prevention    | Input sanitization and validation             | Implemented |
| Security Headers  | X-Content-Type-Options, X-Frame-Options, etc. | Implemented |
| HTTPS Enforcement | HSTS header for production                    | Implemented |

---

## Recommendations for Future Development

1. **Implement refresh tokens** for better JWT security
2. **Add two-factor authentication** for sensitive operations
3. **Implement audit logging** for all data modifications
4. **Add IP-based blocking** after repeated failed attempts
5. **Consider using a dedicated secrets manager** in production

---

## Conclusion

While AI-assisted development significantly accelerated the coding process, manual security review was essential. The AI-generated code often lacked critical security controls that are necessary for production applications. Each suggestion was carefully evaluated against OWASP security guidelines before implementation.

**Key Takeaway:** AI tools are valuable for scaffolding and boilerplate code, but security-critical logic must always be human-reviewed and tested.
