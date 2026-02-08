# SWENG 861 - Campus Analytics Project

**Student:** Jomar Thomas Almonte
**Course:** SWENG 861 | Software Construction
**Semester:** Spring 2026

## Project Description

A campus analytics platform designed to aggregate metrics from various university domains (Enrollment, Facilities, etc.) into a centralized dashboard with secure APIs, a modern frontend, and 3rd party integrations.

---

## Week 4 Assignment: Front-End Development & Secure API Integration

This week's deliverable implements a complete frontend application using **Next.js (App Router)**, **React 19**, **TailwindCSS 4**, and **NextAuth.js**. The frontend and backend are integrated into a single Next.js application.

### Features Implemented

| Feature                | Description                                                  | Status    |
| ---------------------- | ------------------------------------------------------------ | --------- |
| Login Page             | Username/password + Google OAuth login                       | Completed |
| Centralized API Client | Shared client with auto token + 401/403 handling             | Completed |
| Metrics List Page      | Table with pagination, category filter, loading/error states | Completed |
| Metric Detail Page     | Full detail view with 404/403 handling                       | Completed |
| Create/Edit Metric     | Form with client-side JS validation + success feedback       | Completed |
| Responsive Design      | Mobile-first layout with Tailwind responsive classes         | Completed |
| Security Headers       | X-Content-Type-Options, X-Frame-Options, HSTS                | Completed |
| Route Protection       | Middleware redirects unauthenticated users                   | Completed |

### Frontend Architecture

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 with TailwindCSS 4
- **Auth:** NextAuth.js 4 (Google OAuth + Credentials) + JWT Bearer tokens
- **API Client:** Centralized `lib/apiClient.js` with automatic token attachment and error handling
- **State:** Local component state for forms/UI, SessionProvider for auth

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
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)
```

### Running the Application

```bash
# Development (starts both frontend and backend on port 3000)
npm run dev

# Production build
npm run build
npm start
```

### Access Points

| URL                               | Description           |
| --------------------------------- | --------------------- |
| http://localhost:3000             | Dashboard (home page) |
| http://localhost:3000/login       | Login page            |
| http://localhost:3000/metrics     | Metrics list          |
| http://localhost:3000/metrics/new | Create new metric     |
| http://localhost:3000/api/health  | Health check endpoint |

---

## Project Structure

```
sweng861-crud-jzt5803/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── auth/
│   │   │   ├── [...nextauth]/    # NextAuth.js catch-all
│   │   │   ├── login/            # POST /api/auth/login
│   │   │   └── register/         # POST /api/auth/register
│   │   ├── events/               # GET /api/events
│   │   ├── health/               # GET /api/health
│   │   ├── metrics/              # GET, POST /api/metrics
│   │   │   └── [id]/             # GET, PUT, DELETE /api/metrics/:id
│   │   ├── secure-data/          # GET /api/secure-data
│   │   └── weather/              # Weather API endpoints
│   │       ├── cache/stats/
│   │       ├── history/
│   │       └── preview/
│   ├── components/               # Reusable React components
│   │   ├── AuthProvider.js       # NextAuth SessionProvider
│   │   ├── MetricForm.js         # Create/edit form with validation
│   │   ├── Navbar.js             # Navigation bar
│   │   ├── Spinner.js            # Loading spinner
│   │   └── WeatherWidget.js      # Weather display widget
│   ├── login/                    # Login page
│   ├── metrics/                  # Metrics pages
│   │   ├── [id]/                 # Detail + edit pages
│   │   └── new/                  # Create page
│   ├── globals.css               # TailwindCSS imports
│   ├── layout.js                 # Root layout
│   └── page.js                   # Dashboard
├── lib/                          # Shared server + client libraries
│   ├── apiClient.js              # Centralized frontend API client
│   ├── apiErrors.js              # API error class + handler
│   ├── auth.js                   # JWT utilities (server-side)
│   ├── db.js                     # Sequelize database connection
│   ├── models/                   # Sequelize models
│   │   ├── DomainEvent.js
│   │   ├── Metric.js
│   │   ├── User.js
│   │   ├── WeatherData.js
│   │   └── index.js              # Model associations + ensureDb()
│   ├── rateLimit.js              # In-memory rate limiter
│   ├── services/
│   │   ├── eventEmitter.js       # Domain event service
│   │   └── weatherService.js     # Open-Meteo API integration
│   └── validation.js             # Input validation functions
├── __tests__/                    # Test suite
│   └── api.test.js               # Integration tests
├── postman/                      # Postman collection
├── docs/                         # Documentation
├── middleware.js                  # Next.js middleware (security + auth)
├── next.config.mjs               # Next.js configuration
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## API Endpoints

### Authentication

| Method | Endpoint                  | Description             | Auth |
| ------ | ------------------------- | ----------------------- | ---- |
| POST   | `/api/auth/register`      | Register new user       | No   |
| POST   | `/api/auth/login`         | Login with credentials  | No   |
| GET    | `/api/auth/[...nextauth]` | NextAuth OAuth flow     | No   |
| GET    | `/api/secure-data`        | Test protected endpoint | Yes  |

### Metrics (CRUD)

| Method | Endpoint           | Description      | Auth |
| ------ | ------------------ | ---------------- | ---- |
| GET    | `/api/metrics`     | List all metrics | Yes  |
| GET    | `/api/metrics/:id` | Get metric by ID | Yes  |
| POST   | `/api/metrics`     | Create metric    | Yes  |
| PUT    | `/api/metrics/:id` | Update metric    | Yes  |
| DELETE | `/api/metrics/:id` | Delete metric    | Yes  |

### Weather (3rd Party API)

| Method | Endpoint                   | Description            | Auth |
| ------ | -------------------------- | ---------------------- | ---- |
| GET    | `/api/weather`             | Fetch & save weather   | Yes  |
| GET    | `/api/weather/preview`     | Preview weather        | Yes  |
| GET    | `/api/weather/history`     | User's weather history | Yes  |
| GET    | `/api/weather/cache/stats` | Cache statistics       | Yes  |

### Domain Events

| Method | Endpoint      | Description        | Auth |
| ------ | ------------- | ------------------ | ---- |
| GET    | `/api/events` | List domain events | Yes  |

---

## Example Usage

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
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
curl "http://localhost:3000/api/weather/preview?latitude=40.7983&longitude=-77.8599" \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Testing

### Run Integration Tests

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
docker-compose logs -f app

# Stop containers
docker-compose down
```

### Docker Images

- **Production:** Next.js standalone build with non-root user
- **Development:** Hot reload with volume mounting (use `--profile development`)

---

## Environment Variables

| Variable               | Description          | Default               |
| ---------------------- | -------------------- | --------------------- |
| `NEXTAUTH_URL`         | App URL for NextAuth | http://localhost:3000 |
| `NEXTAUTH_SECRET`      | NextAuth signing key | (required)            |
| `JWT_SECRET`           | JWT signing key      | (required in prod)    |
| `GOOGLE_CLIENT_ID`     | Google OAuth ID      | (optional)            |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret  | (optional)            |

---

## Security Features

- **Authentication:** JWT tokens with 1-hour expiration + NextAuth.js sessions
- **Authorization:** Owner-based access control (BOLA prevention)
- **Rate Limiting:** Tiered limits for API, auth, and external calls
- **Input Validation:** Server-side validation + client-side JS validation
- **Security Headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS
- **Password Hashing:** bcrypt with cost factor 12
- **Route Protection:** Next.js middleware redirects unauthenticated users
- **Centralized API Client:** Automatic token attachment, 401/403 handling

---

## Previous Assignments

### Week 3: Backend Development

- 3rd Party API Integration (Open-Meteo weather)
- Full CRUD operations for campus metrics
- Multi-tenancy with BOLA prevention
- Domain events with async processing
- Rate limiting and caching

### Week 2: Authentication & Protected APIs

- Google OAuth 2.0 integration
- JWT-based authentication
- Protected API endpoints

### Week 1: Hello/Health Endpoint

- Basic project setup
- Health check endpoint

---

## License

ISC License - See LICENSE file for details.
