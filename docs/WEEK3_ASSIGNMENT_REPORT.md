# Week 3 Assignment Report: Backend Development

## Campus Analytics API

**Author:** Jomar Thomas Almonte
**Course:** SWENG 861 - Software Construction
**Date:** January 2026

---

## Executive Summary

This report details the implementation of a RESTful backend API for the Campus Analytics platform. The implementation includes 3rd party API integration, full CRUD operations, authentication/authorization, domain event handling, and containerization.

---

## Table of Contents

1. [Part 1: 3rd Party API Integration](#part-1-3rd-party-api-integration)
2. [Part 2: RESTful API with CRUD Operations](#part-2-restful-api-with-crud-operations)
3. [Part 3: Additional Requirements](#part-3-additional-requirements)
4. [Advanced Features](#advanced-features)
5. [Testing Documentation](#testing-documentation)
6. [API Documentation](#api-documentation)
7. [Deployment Instructions](#deployment-instructions)

---

## Part 1: 3rd Party API Integration

### API Selected: Open-Meteo Weather API

**Why Open-Meteo?**

- Free to use without API key requirements
- Reliable uptime and good documentation
- Returns JSON format data
- Relevant to campus analytics (weather impacts campus operations)

### Implementation Details

**File:** `backend/services/weatherService.js`

#### Data Flow:

1. User requests weather data for coordinates
2. Service validates coordinates (latitude: -90 to 90, longitude: -180 to 180)
3. Check in-memory cache (10-minute TTL)
4. If not cached, fetch from Open-Meteo API
5. Validate API response structure
6. Transform and save to database
7. Emit domain event for async processing
8. Return data to user

#### API Endpoints:

| Method | Endpoint                                      | Description                 |
| ------ | --------------------------------------------- | --------------------------- |
| GET    | `/api/weather?latitude=X&longitude=Y`         | Fetch and save weather data |
| GET    | `/api/weather/preview?latitude=X&longitude=Y` | Preview without saving      |
| GET    | `/api/weather/history`                        | Get user's weather history  |
| GET    | `/api/weather/cache/stats`                    | Get cache statistics        |

#### Data Validation:

```javascript
validateCoordinates(latitude, longitude) {
  const errors = [];
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  return { isValid: errors.length === 0, errors };
}
```

#### Caching Implementation:

- Uses `node-cache` for in-memory caching
- 10-minute TTL for weather data
- Reduces API calls and improves response time

---

## Part 2: RESTful API with CRUD Operations

### Domain Model: Campus Metrics

**File:** `backend/database.js`

The Metric model represents campus analytics data points:

```javascript
const Metric = sequelize.define('Metric', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.ENUM(
      'enrollment',
      'facilities',
      'academic',
      'financial',
      'other'
    ),
    allowNull: false,
  },
  value: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: 'count' },
  description: { type: DataTypes.TEXT },
  metadata: { type: DataTypes.JSON },
  recordedAt: { type: DataTypes.DATE },
  userId: { type: DataTypes.INTEGER }, // Multi-tenancy
});
```

### CRUD Endpoints

**File:** `backend/routes/metrics.js`

| Method | Endpoint           | Description             | Auth Required |
| ------ | ------------------ | ----------------------- | ------------- |
| POST   | `/api/metrics`     | Create new metric       | Yes           |
| GET    | `/api/metrics`     | List all user's metrics | Yes           |
| GET    | `/api/metrics/:id` | Get specific metric     | Yes           |
| PUT    | `/api/metrics/:id` | Update metric           | Yes           |
| DELETE | `/api/metrics/:id` | Delete metric           | Yes           |

### Example Requests:

**Create Metric:**

```json
POST /api/metrics
Authorization: Bearer <token>

{
  "name": "Fall 2024 Enrollment",
  "category": "enrollment",
  "value": 45000,
  "unit": "students",
  "description": "Total student enrollment",
  "metadata": { "campus": "University Park" }
}
```

**Response:**

```json
{
  "message": "Metric created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Fall 2024 Enrollment",
    "category": "enrollment",
    "value": 45000,
    "userId": 1,
    "createdAt": "2026-01-31T12:00:00.000Z"
  }
}
```

### Database Persistence

- SQLite database via Sequelize ORM
- UUID primary keys for security
- Timestamps for audit trail
- Cascade delete for user data cleanup

---

## Part 3: Additional Requirements

### Error Handling

**File:** `backend/middleware/errorHandler.js`

Comprehensive error handling for:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Rate limit errors (429)
- Database errors (500)
- External API errors (502)

```javascript
class ApiError extends Error {
  static badRequest(message) {
    return new ApiError(400, message);
  }
  static unauthorized(message) {
    return new ApiError(401, message);
  }
  static forbidden(message) {
    return new ApiError(403, message);
  }
  static notFound(message) {
    return new ApiError(404, message);
  }
}
```

### Security Measures

1. **HTTPS Headers:**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security

2. **Input Validation:**
   - All inputs validated with express-validator
   - Request body size limited to 10KB
   - SQL injection prevented via ORM

3. **Authentication:**
   - JWT tokens with 1-hour expiration
   - bcrypt password hashing (cost factor 12)
   - Google OAuth 2.0 integration

### Testing

**File:** `backend/tests/api.test.js`

Test coverage includes:

- Health check endpoints
- User registration and login
- JWT token validation
- CRUD operations for metrics
- BOLA/IDOR prevention
- Weather API integration
- Input validation
- Error handling

Run tests: `npm test`

---

## Advanced Features

### Authentication & Authorization

**JWT-based Authentication:**

- Token issued on login/OAuth
- 1-hour expiration
- Contains: userId, username, role

**Authorization Levels:**

- Public: Health check, API docs
- Authenticated: All CRUD operations
- Owner-only: Access to own data only

### Rate Limiting

**File:** `backend/middleware/rateLimiter.js`

| Limiter  | Requests | Window | Applied To      |
| -------- | -------- | ------ | --------------- |
| API      | 100      | 15 min | All /api routes |
| Auth     | 5        | 15 min | Login/Register  |
| External | 30       | 15 min | Weather API     |
| Create   | 20       | 15 min | POST operations |

### Caching

- Weather data: 10-minute TTL
- In-memory cache via node-cache
- Cache statistics endpoint available

### Domain Events

**File:** `backend/services/eventEmitter.js`

Events emitted on data changes:

- `metric.created`
- `metric.updated`
- `metric.deleted`
- `weather.fetched`

Events are:

1. Persisted to DomainEvent table
2. Processed asynchronously
3. Status tracked (pending/processed/failed)

### Containerization

**Files:** `Dockerfile`, `docker-compose.yml`

Features:

- Multi-stage build for optimization
- Non-root user for security
- Health checks
- Volume persistence for SQLite
- Development and production profiles

---

## Testing Documentation

### Postman Collection

**File:** `postman/CampusAnalytics.postman_collection.json`

Import into Postman to test all endpoints. The collection includes:

- Automatic token management
- Pre-request scripts
- Test assertions
- Environment variables

### Running Tests

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Start server for manual testing
npm start

# Access Swagger docs
open http://localhost:3000/api-docs
```

---

## API Documentation

### Swagger/OpenAPI

**Access:** `http://localhost:3000/api-docs`

The API documentation includes:

- All endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Example requests
- Error responses

**JSON Spec:** `http://localhost:3000/api-docs.json`

---

## Deployment Instructions

### Local Development

```bash
# Clone repository
git clone <repo-url>
cd sweng861-crud-jzt5803

# Install dependencies
npm install

# Start development server
npm start

# Server runs on http://localhost:3000
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Environment Variables

| Variable             | Description            | Required           |
| -------------------- | ---------------------- | ------------------ |
| PORT                 | Server port            | No (default: 3000) |
| JWT_SECRET           | JWT signing key        | Yes (production)   |
| SESSION_SECRET       | Session encryption key | Yes (production)   |
| GOOGLE_CLIENT_ID     | Google OAuth ID        | For OAuth          |
| GOOGLE_CLIENT_SECRET | Google OAuth Secret    | For OAuth          |
| NODE_ENV             | Environment mode       | No                 |

---

## Conclusion

This implementation satisfies all requirements for the Week 3 Backend Development assignment:

**Part 1 (3rd Party API):**

- Open-Meteo weather API integration
- Data validation and transformation
- Database persistence with user ownership

**Part 2 (RESTful CRUD):**

- Full CRUD operations for metrics
- Proper REST endpoint design
- Swagger API documentation

**Part 3 (Additional Requirements):**

- Comprehensive error handling
- Security headers and best practices
- Thorough testing with Postman collection

**Advanced Features:**

- JWT authentication with Google OAuth
- Rate limiting and caching
- Domain event emission
- Docker containerization

---

## GitHub Repository

Repository: https://github.com/psu-edu/sweng861-crud-jzt5803

Branch: `claude/review-code-changes-6Bvcp`
