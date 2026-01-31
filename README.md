# SWENG 861 - Campus Analytics Project

**Student:** Jomar Thomas Almonte
**Course:** SWENG 861 | Software Construction
**Semester:** Spring 2026

## Project Description

A campus analytics platform designed to aggregate metrics from various university domains (Enrollment, Facilities, etc.) into a centralized dashboard with secure APIs and 3rd party integrations.

---

## Week 3 Assignment: Backend Development

This week's deliverable implements a complete RESTful backend with:

- **3rd Party API Integration:** Weather data from Open-Meteo API
- **CRUD Operations:** Full Create, Read, Update, Delete for campus metrics
- **Multi-tenancy:** User-based data isolation (BOLA prevention)
- **Domain Events:** Async event emission and processing
- **API Documentation:** Swagger/OpenAPI specification

### Features Implemented

| Feature         | Description                       | Status    |
| --------------- | --------------------------------- | --------- |
| 3rd Party API   | Open-Meteo weather integration    | Completed |
| Data Validation | Input validation on all endpoints | Completed |
| Metrics CRUD    | Full CRUD for campus metrics      | Completed |
| Authentication  | JWT + Google OAuth 2.0            | Completed |
| Authorization   | Owner-based access control        | Completed |
| Rate Limiting   | Tiered rate limits                | Completed |
| Caching         | In-memory weather cache           | Completed |
| Domain Events   | Async event processing            | Completed |
| API Docs        | Swagger UI                        | Completed |
| Docker          | Multi-stage Dockerfile            | Completed |

---

## Quick Start

### Prerequisites

- Node.js v18 or higher
- npm v8 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/psu-edu/sweng861-crud-jzt5803.git
cd sweng861-crud-jzt5803

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your values

# Start the server
npm start
```

### Access Points

| URL                            | Description               |
| ------------------------------ | ------------------------- |
| http://localhost:3000          | Home page                 |
| http://localhost:3000/api-docs | Swagger API Documentation |
| http://localhost:3000/health   | Health check endpoint     |

---

## API Endpoints

### Authentication

| Method | Endpoint       | Description             | Auth |
| ------ | -------------- | ----------------------- | ---- |
| POST   | `/register`    | Register new user       | No   |
| POST   | `/login`       | Login with credentials  | No   |
| GET    | `/auth/google` | Google OAuth login      | No   |
| GET    | `/secure-data` | Test protected endpoint | Yes  |

### Metrics (CRUD)

| Method | Endpoint           | Description      | Auth |
| ------ | ------------------ | ---------------- | ---- |
| GET    | `/api/metrics`     | List all metrics | Yes  |
| GET    | `/api/metrics/:id` | Get metric by ID | Yes  |
| POST   | `/api/metrics`     | Create metric    | Yes  |
| PUT    | `/api/metrics/:id` | Update metric    | Yes  |
| DELETE | `/api/metrics/:id` | Delete metric    | Yes  |

### Weather (3rd Party API)

| Method | Endpoint               | Description            | Auth |
| ------ | ---------------------- | ---------------------- | ---- |
| GET    | `/api/weather`         | Fetch & save weather   | Yes  |
| GET    | `/api/weather/preview` | Preview weather        | Yes  |
| GET    | `/api/weather/history` | User's weather history | Yes  |

### Domain Events

| Method | Endpoint      | Description        | Auth |
| ------ | ------------- | ------------------ | ---- |
| GET    | `/api/events` | List domain events | Yes  |

---

## Example Usage

### Register a User

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Create a Metric

```bash
curl -X POST http://localhost:3000/api/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Fall 2024 Enrollment",
    "category": "enrollment",
    "value": 45000,
    "unit": "students",
    "description": "Total enrollment for Fall semester"
  }'
```

### Fetch Weather Data

```bash
curl "http://localhost:3000/api/weather?latitude=40.7983&longitude=-77.8599" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Postman Collection

Import the Postman collection from `postman/CampusAnalytics.postman_collection.json` for interactive API testing.

---

## Docker Deployment

### Build and Run

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop containers
docker-compose down
```

### Docker Images

- **Production:** Multi-stage build with non-root user
- **Development:** Hot reload with volume mounting

---

## Project Structure

```
sweng861-crud-jzt5803/
├── backend/
│   ├── app.js                 # Main application entry
│   ├── database.js            # Sequelize models
│   ├── authMiddleware.js      # JWT verification
│   ├── passportConfig.js      # Google OAuth setup
│   ├── config/
│   │   └── swagger.js         # Swagger configuration
│   ├── middleware/
│   │   ├── errorHandler.js    # Error handling
│   │   └── rateLimiter.js     # Rate limiting
│   ├── routes/
│   │   ├── metrics.js         # Metrics CRUD routes
│   │   └── weather.js         # Weather API routes
│   ├── services/
│   │   ├── eventEmitter.js    # Domain event service
│   │   └── weatherService.js  # Weather API service
│   └── tests/
│       └── api.test.js        # Unit tests
├── docs/
│   ├── AI_AUDIT.md            # AI audit documentation
│   └── WEEK3_ASSIGNMENT_REPORT.md  # Assignment report
├── postman/
│   └── CampusAnalytics.postman_collection.json
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Environment Variables

| Variable               | Description         | Default            |
| ---------------------- | ------------------- | ------------------ |
| `PORT`                 | Server port         | 3000               |
| `NODE_ENV`             | Environment         | development        |
| `JWT_SECRET`           | JWT signing key     | (required in prod) |
| `SESSION_SECRET`       | Session key         | (required in prod) |
| `GOOGLE_CLIENT_ID`     | Google OAuth ID     | (optional)         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | (optional)         |

---

## Security Features

- **Authentication:** JWT tokens with 1-hour expiration
- **Authorization:** Owner-based access control (BOLA prevention)
- **Rate Limiting:** Tiered limits for API, auth, and external calls
- **Input Validation:** All inputs validated with express-validator
- **Security Headers:** X-Content-Type-Options, X-Frame-Options, HSTS
- **Password Hashing:** bcrypt with cost factor 12

---

## Previous Assignments

### Week 2: Authentication & Protected APIs

- Google OAuth 2.0 integration
- JWT-based authentication
- Protected API endpoints

### Week 1: Hello/Health Endpoint

- Basic Express server setup
- Health check endpoint

---

## Documentation

- **API Docs:** http://localhost:3000/api-docs
- **Assignment Report:** `docs/WEEK3_ASSIGNMENT_REPORT.md`
- **AI Audit:** `docs/AI_AUDIT.md`

---

## License

ISC License - See LICENSE file for details.
