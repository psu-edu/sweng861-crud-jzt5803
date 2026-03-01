# SWENG 861 - Campus Analytics Project

**Student:** Jomar Thomas Almonte
**Course:** SWENG 861 | Software Construction
**Semester:** Spring 2026

[![CI – Build, Test, Package](https://github.com/psu-edu/sweng861-crud-jzt5803/actions/workflows/ci.yml/badge.svg)](https://github.com/psu-edu/sweng861-crud-jzt5803/actions/workflows/ci.yml)

## Project Description

A campus analytics platform designed to aggregate metrics from various university domains (Enrollment, Facilities, etc.) into a centralized dashboard with secure APIs, a modern frontend, and 3rd party integrations.

---

## Current Feature Status (All Weeks)

### Features Implemented

| Feature                   | Description                                                           | Status    |
| ------------------------- | --------------------------------------------------------------------- | --------- |
| Login Page                | Username/password + Google OAuth login                                | Completed |
| Centralized API Client    | Shared client with auto token + 401/403 handling                      | Completed |
| Metrics List Page         | Table with pagination, category filter, comma-formatted values        | Completed |
| Metric Detail Page        | Full detail view with 404/403 handling                                | Completed |
| Create/Edit Metric        | Form with client-side JS validation + success feedback                | Completed |
| Admin Master View         | `superadmin` role sees ALL metrics across all users                   | Completed |
| OAuth JWT Bridge          | Google OAuth users auto-receive a JWT via `/api/auth/token`           | Completed |
| Responsive Design         | Mobile-first layout with Tailwind responsive classes                  | Completed |
| Security Headers          | X-Content-Type-Options, X-Frame-Options, HSTS                         | Completed |
| Route Protection          | Middleware redirects unauthenticated users                            | Completed |
| Weather Widget (US units) | Live Penn State weather — temperature in °F, wind speed in mph        | Completed |
| US Number Formatting      | All metric values displayed with commas; USD values prefixed with `$` | Completed |
| Seed Data                 | `npm run seed` creates `superadmin` + 20 campus metrics               | Completed |
| CI/CD Pipeline            | GitHub Actions: build → Jest tests → npm audit → Docker + smoke test  | Completed |
| Structured Logging        | JSON logger with sensitive-key sanitization (`lib/logger.js`)         | Completed |
| Prometheus Metrics        | Zero-dependency metrics module (`lib/metrics.js`), 4 metric families  | Completed |
| Health Endpoints          | `/api/health`, `/api/health/live`, `/api/health/ready`                | Completed |
| Grafana Dashboard         | Auto-provisioned 5-panel observability dashboard via Docker Compose   | Completed |
| Docker Deployment         | Multi-stage Alpine build, non-root user `nextjs:1001`                 | Completed |

### Architecture

- **Framework:** Next.js 15 (App Router) — unified frontend + backend in one deploy
- **UI:** React 19 with TailwindCSS 4
- **Auth:** NextAuth.js 4 (Google OAuth + Credentials) + JWT Bearer tokens
- **API Client:** Centralized `lib/apiClient.js` with automatic token attachment and error handling
- **State:** Local component state for forms/UI, SessionProvider for auth
- **Data:** SQLite + Sequelize 6, 4 models (User, Metric, WeatherData, DomainEvent)

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

# Copy environment configuration and set secrets
cp .env.example .env.local
# Edit .env.local — set NEXTAUTH_SECRET and JWT_SECRET (see Environment Variables below)

# Seed the database (admin account + 20 sample metrics)
npm run seed
```

### Running the Application

```bash
# Development (starts both frontend and backend on port 3000)
npm run dev

# Production build
npm run build
npm start
```

### Admin Master Account

After running `npm run seed` the following superadmin account is available:

| Field    | Value        |
| -------- | ------------ |
| Username | `superadmin` |
| Password | `Campus123!` |
| Role     | `admin`      |

The seed script also creates **20 sample campus metrics** across all 5 categories (enrollment, facilities, academic, financial, other). Admins see **all metrics** regardless of who created them.

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
│   │   ├── health/               # GET /api/health, /live, /ready
│   │   ├── prometheus/           # GET /api/prometheus (metrics scrape)
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
│   ├── logger.js                 # Structured JSON logger (sensitive-key sanitized)
│   ├── metrics.js                # Prometheus-compatible in-memory metrics
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
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD pipeline
├── Dockerfile                     # Multi-stage build, non-root user
├── docker-compose.yml             # App + Prometheus + Grafana
└── prometheus.yml                 # Prometheus scrape configuration
```

---

## API Endpoints

### Authentication

| Method | Endpoint                  | Description                                             | Auth  |
| ------ | ------------------------- | ------------------------------------------------------- | ----- |
| POST   | `/api/auth/register`      | Register new user                                       | No    |
| POST   | `/api/auth/login`         | Login with credentials, returns JWT                     | No    |
| GET    | `/api/auth/[...nextauth]` | NextAuth OAuth flow                                     | No    |
| GET    | `/api/auth/token`         | Exchange active NextAuth session for JWT (OAuth bridge) | Yes\* |
| GET    | `/api/secure-data`        | Test protected endpoint                                 | Yes   |

> `*` Requires NextAuth session cookie (used automatically by Google OAuth users)

### Metrics (CRUD)

| Method | Endpoint           | Description                                  | Auth |
| ------ | ------------------ | -------------------------------------------- | ---- |
| GET    | `/api/metrics`     | List metrics (admin sees all; users see own) | Yes  |
| GET    | `/api/metrics/:id` | Get metric by ID                             | Yes  |
| POST   | `/api/metrics`     | Create metric                                | Yes  |
| PUT    | `/api/metrics/:id` | Update metric                                | Yes  |
| DELETE | `/api/metrics/:id` | Delete metric                                | Yes  |

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

### Health & Observability

| Method | Endpoint            | Description                                | Auth |
| ------ | ------------------- | ------------------------------------------ | ---- |
| GET    | `/api/health`       | `{status, db, uptime, timestamp, version}` | No   |
| GET    | `/api/health/live`  | Liveness probe – always 200                | No   |
| GET    | `/api/health/ready` | Readiness probe – 200 or 503 if DB down    | No   |
| GET    | `/api/prometheus`   | Prometheus metrics scrape endpoint         | No   |

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

### Unit & Frontend Tests (~320 test cases)

```bash
# Run all Jest tests with coverage (self-contained, used in CI)
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run frontend component tests only
npm run test:frontend
```

| Suite    | Files | Tests | Coverage areas                                                        |
| -------- | ----- | ----- | --------------------------------------------------------------------- |
| Unit     | 7     | ~196  | auth, validation, rate limiting, events, errors, weather, middleware  |
| Frontend | 7     | ~124  | LoginPage, MetricForm, Navbar, WeatherWidget, AuthProvider, apiClient |

### Integration Tests

```bash
# Requires a running server on port 3001
PORT=3001 npm run dev   # in one terminal
npm run test:integration # in another terminal
```

The integration suite (`__tests__/api.test.js`) runs full HTTP cycles: register → login → CRUD → weather → domain events.

### Postman Collection

Import `postman/CampusAnalytics.postman_collection.json` for interactive API testing with pre-configured status-code assertions.

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on every push and pull request to `main`.

| Job              | Steps                                                                                   | Gate                    |
| ---------------- | --------------------------------------------------------------------------------------- | ----------------------- |
| `build-and-test` | checkout → Node 18 → `npm ci` → `npm run build` → `npm run test:coverage` → `npm audit` | Fails if any test fails |
| `docker-build`   | checkout → Docker Buildx → build `campus-analytics:<sha>` → smoke-test `/api/health`    | Needs `build-and-test`  |

---

## Observability Stack

### Start the Full Stack (App + Prometheus + Grafana)

```bash
docker-compose up -d
```

| Service    | URL                   | Credentials       |
| ---------- | --------------------- | ----------------- |
| App        | http://localhost:3000 | (your login)      |
| Prometheus | http://localhost:9090 | —                 |
| Grafana    | http://localhost:4000 | admin / campus123 |

### Key Observability Endpoints

```bash
curl http://localhost:3000/api/health       # {status, db, uptime, timestamp, version}
curl http://localhost:3000/api/health/live  # liveness probe – always 200
curl http://localhost:3000/api/health/ready # readiness probe – 200 or 503
curl http://localhost:3000/api/prometheus   # Prometheus text metrics
```

### Prometheus Metrics

| Metric                     | Type      | Labels                              |
| -------------------------- | --------- | ----------------------------------- |
| `http_requests_total`      | Counter   | method, route, status               |
| `http_request_duration_ms` | Histogram | method, route (buckets: 50–2000 ms) |
| `metrics_created_total`    | Counter   | — (domain KPI)                      |
| `auth_logins_total`        | Counter   | status (success\|failure)           |

The Grafana dashboard ("Campus Analytics – Observability") auto-provisions with 5 panels: HTTP Request Rate, Error Rate, p95 Latency, Metrics Created, and Successful Logins.

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
- **OAuth JWT Bridge:** `GET /api/auth/token` issues a JWT for Google OAuth sessions so the API client works transparently

---

## Seed Data & Admin Account

Run once after installation to create the superadmin account and 20 sample metrics:

```bash
npm run seed
```

| Account    | Username     | Password     | Role  |
| ---------- | ------------ | ------------ | ----- |
| Superadmin | `superadmin` | `Campus123!` | admin |

The seed creates 4 metrics in each of the 5 categories: `enrollment`, `facilities`, `academic`, `financial`, `other`.
Admin users can see **all metrics** from every user in the system.

---

## Weekly Assignment Highlights

### Week 7: Final Deliverables & End-to-End QA

- Full auth stack audit: root-caused middleware secret mismatch causing redirect loop; fixed fallback chain alignment
- OAuth JWT bridge: `GET /api/auth/token` + `JwtSynchronizer` in `AuthProvider.js` — Google OAuth users auto-receive a JWT
- Data persistence fix: changed `sync({ alter: true })` → `sync()` in `ensureDb()` to prevent SQLite table recreation wipe
- Admin visibility: `GET /api/metrics` now returns all metrics for `role: admin` users (master dashboard view)
- `scripts/seed.js` + `npm run seed`: creates `superadmin` / `Campus123!` + 20 sample metrics across all 5 categories
- UX polish: weather widget converted to °F / mph; metric values comma-formatted with en-US locale; USD values prefixed with `$`
- Race condition fix: metrics page waits for NextAuth session resolution before making API calls

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

### Week 5: Automated Testing

- ~320 automated tests (Jest 30 + React Testing Library)
- Unit tests for all `lib/` modules: auth, validation, rate limiting, event emitter, errors, weather
- Frontend component tests for all React components (login, metrics, navbar, weather widget)
- Integration test suite covering the full HTTP lifecycle
- Code coverage reporting (lcov + HTML, uploaded as CI artifact)

### Week 6: DevOps & Observability

- Multi-stage Docker build: non-root `nextjs:1001` user, Alpine base, built-in `HEALTHCHECK`
- GitHub Actions CI/CD: build → Jest quality gate → `npm audit` → Docker image + smoke test
- Structured JSON logging (`lib/logger.js`) with automatic sensitive-key sanitization
- Zero-dependency Prometheus metrics (`lib/metrics.js`) — 4 metric families with histogram
- Three-tier health endpoints: `/api/health`, `/api/health/live`, `/api/health/ready`
- Grafana observability dashboard auto-provisioned via Docker Compose (5 panels)
- Scalability & FinOps analysis: SQLite bottlenecks identified, PostgreSQL migration path defined
- AI/GenAI DevSecOps audit: 3 security issues found and fixed in AI-generated CI/CD YAML

### Week 4: Frontend Development

- Next.js App Router frontend with React 19 and TailwindCSS 4
- Metrics CRUD pages with pagination, category filters, and form validation
- Login/Register page (Credentials + Google OAuth)
- Responsive design with security headers middleware

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
