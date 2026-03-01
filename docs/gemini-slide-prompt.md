# Gemini Prompt — Campus Analytics Presentation Slides
# Usage: Paste the DESIGN SYSTEM section + ONE SLIDE SPEC at a time into Gemini.
# Say: "Generate a presentation slide image using the design system and slide spec below."

---

## HOW TO USE THIS FILE

1. Copy the **DESIGN SYSTEM** section (everything under that header).
2. Then copy one **SLIDE X** section.
3. Paste both together into Gemini and say:
   > "Generate a widescreen 16:9 presentation slide image exactly as specified.
   > Follow the design system and slide spec precisely. Do not add extra content."
4. Repeat for each of the 9 slides.

---

## ═══════════════════════════════════════════════════════════
## DESIGN SYSTEM  (include this with EVERY slide prompt)
## ═══════════════════════════════════════════════════════════

You are a professional presentation designer. Generate a single widescreen (16:9 ratio,
1920×1080px) presentation slide image. Follow these design rules exactly for all slides:

### Color Palette
- Navy (primary):     #1e3a5f  — used for title text, section headers, accent bars
- Steel Blue:         #2196f3  — used for vertical dividers and accent lines
- Light Blue:         #90caf9  — used for subtitles on dark backgrounds
- White:              #ffffff  — slide backgrounds, table text on dark rows
- Light Gray:         #f0f4f8  — title bar background, alternating table rows
- Dark Gray:          #333333  — body text
- Monospace BG:       #f5f5f5  — background for code/diagram boxes
- Red (warning):      #c62828  — used for ✗ failure items
- Green (success):    #2e7d32  — used for ✓ completed items

### Typography
- Font family: Calibri for all text; Courier New for code/diagram boxes
- Slide title (assertion): 26–28pt, bold, Navy (#1e3a5f), left-aligned
- Section label: 13pt, bold, Navy (#1e3a5f)
- Body text: 13pt, regular, Dark Gray (#333333)
- Sub-text / evidence detail: 12pt, regular, Dark Gray (#333333)
- Monospace code: 10–11pt, Courier New, Dark Gray on #f5f5f5 background

### Layout Template (apply to ALL content slides, slides 2–9)
- Top accent bar: full width, 8px tall, Navy (#1e3a5f)
- Left accent bar: 6px wide × 110px tall, Steel Blue (#2196f3), directly below top bar
- Title bar: Light Gray (#f0f4f8) rectangle spanning full width, height ~110px
  - Title text (the assertion) sits inside the title bar, left-aligned, 28pt bold Navy
- Bottom accent bar: full width, 8px tall, Navy (#1e3a5f), at very bottom of slide
- Content area: white background between title bar and bottom bar
- Section labels: 13pt bold Navy, positioned above each content column

### Key Design Principle — Assertion-Evidence Format
- The TITLE is a complete sentence that makes a specific claim (the assertion).
- The BODY contains one piece of visual evidence that proves the claim:
  a diagram, a table, a simple before/after, or a very short list of key points.
- Maximum ~12–15 lines of text on any slide. NO paragraphs. NO dense bullet walls.
- White space is intentional — slides should be readable in 5 seconds.
- The speaker's voice carries the detail. The slide shows only the proof.

---

## ═══════════════════════════════════════════════════════════
## SLIDE 1 — Title Slide
## ═══════════════════════════════════════════════════════════

**Layout:** Full dark navy (#1e3a5f) background. No title bar chrome.

**Content (centered vertically and horizontally):**

- Thin horizontal Steel Blue (#2196f3) accent line spanning full width, positioned at vertical center
- Above the line:
  - Large title text (44pt, bold, White): "Campus Analytics Platform"
- Below the line:
  - Subtitle (22pt, regular, Light Blue #90caf9): "SWENG 861 – Software Construction  |  Spring 2026"
  - Name (20pt, bold, White): "Jomar Thomas Almonte"
  - Institution (15pt, regular, Light Blue #90caf9): "Pennsylvania State University"

**No other elements. Clean, minimal.**

---

## ═══════════════════════════════════════════════════════════
## SLIDE 2 — Requirements
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Campus Analytics Eliminates University Metrics Data Silos"

**Evidence layout:** Two equal columns separated by a thin Steel Blue (#2196f3) vertical divider.

**LEFT COLUMN — "The Problem"** (label in 13pt bold Navy above column)
Background: white. Show a simple two-part structure:

First, one sentence intro in 13pt Dark Gray:
"Departments track metrics in spreadsheets. That creates three failures:"

Then three failure items, each on its own line, 13pt, Red (#c62828), with a ✗ prefix:
  ✗  No audit trail — who changed what, and when?
  ✗  No access control — any user can edit any data
  ✗  No single source of truth — data silos per dept

Then a small "Who is affected:" label (12pt bold Navy) followed by three lines (12pt Dark Gray):
  Faculty        enrollment trends & academic KPIs
  Dept heads     facilities & financial monitoring
  Admins         cross-domain oversight & audit

**RIGHT COLUMN — "The Solution: 7 Features Shipped"** (label in 13pt bold Navy above column)
Background: white. Seven checkmark items, each on its own line, 13pt, Green (#2e7d32), ✓ prefix:
  ✓  JWT + OAuth auth, bcrypt, rate limiting
  ✓  5-category metrics CRUD + admin master view
  ✓  Live weather widget (°F / mph, Penn State coords)
  ✓  Domain event audit trail — append-only
  ✓  Prometheus + Grafana observability
  ✓  GitHub Actions CI/CD pipeline
  ✓  Non-root Docker, 3-stage multi-stage build

Then a small label "Non-Functional Requirements — met, not aspirational:" (12pt bold Navy) and three lines (12pt Dark Gray):
  Security      OWASP Top 10 mitigations applied
  Reliability   ≥99.5% availability, p95 ≤ 500 ms
  Testing       320 automated tests block broken builds

---

## ═══════════════════════════════════════════════════════════
## SLIDE 3 — Architecture
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Next.js 15 Collapses Frontend and API Into One Deploy Unit"

**Evidence layout:** Two columns. Left column ~40% wide, right column ~55% wide.
Thin Steel Blue vertical divider between them.

**LEFT COLUMN — short rationale**
One bold statement (13pt bold Navy) at top: "One codebase. One Docker image. No split deploy."

Then four short sections, each with a 12pt bold Navy label and 1–2 lines of 12pt Dark Gray body:

  Frontend
  Next.js 15 App Router (SSR) + React 19
  TailwindCSS 4 — zero custom CSS files

  API — 15 route handlers
  JWT Bearer + NextAuth session auth
  4-tier rate limiting + BOLA owner checks

  Data — SQLite + Sequelize ORM
  4 models: User, Metric, WeatherData, DomainEvent
  CASCADE deletes enforce referential integrity

  External
  Open-Meteo weather  (free, keyless)
  Google OAuth 2.0 via NextAuth  (optional)

**RIGHT COLUMN — Architecture Diagram (the evidence)**
A clean, professional box-and-arrow architecture diagram rendered on a light gray (#f5f5f5)
background with a subtle border. Use a monospaced or diagrammatic style. Show these layers
from top to bottom connected by arrows:

┌──────────────────────────────────┐
│  Browser (React 19 + Next.js 15) │
│  Dashboard │ Login │ Metrics      │
│  Weather Widget │ Forms           │
└─────────────────┬────────────────┘
                  │ HTTPS / JWT
┌─────────────────▼────────────────┐
│  Next.js API Routes (Node.js)    │
│  Auth │ Rate Limit │ Validation  │
│  15 route handlers               │
└──────┬──────────────────┬────────┘
       │                  │
┌──────▼──────┐  ┌────────▼───────┐
│  SQLite DB   │  │ Open-Meteo API │
│  Sequelize   │  │ (cached 10min) │
│  4 models    │  └────────────────┘
└──────┬──────┘
       │
┌──────▼──────────────────────────┐
│  DevOps Layer                   │
│  Docker │ GitHub Actions        │
│  Prometheus │ Grafana           │
└─────────────────────────────────┘

Render this diagram cleanly with boxes, connecting lines, and arrows. Navy boxes with
white text for the main layers; lighter styling for external integrations.

---

## ═══════════════════════════════════════════════════════════
## SLIDE 4 — Technology Stack
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Every Technology Choice Minimizes Overhead and Maximizes Testability"

**Evidence layout:** A single full-width table spanning almost the entire content area.
The table IS the evidence. Each row proves a specific choice was made for a reason.

**Table structure:**
- 3 columns: Layer | Technology | Why This Choice — The Evidence
- Column widths: Layer (~14%), Technology (~22%), Evidence (~64%)
- Header row: Navy (#1e3a5f) background, white bold text, 11pt, centered
- Alternating row backgrounds: Light Gray (#f0f4f8) and White
- Row text: 10pt Dark Gray; Layer column is bold Navy

**Table rows (9 data rows):**

| Layer | Technology | Why This Choice — The Evidence |
|-------|------------|-------------------------------|
| Frontend | Next.js 15 App Router | UI + API in one image — no separate server, no CORS, no split deploy |
| UI | React 19 + TailwindCSS 4 | Utility-first styling: zero custom CSS files in the entire codebase |
| Auth | NextAuth 4 + JWT | One getAuthUser() handles both token types — routes are unaware of the difference |
| Database | SQLite + Sequelize 6 | File-based DB starts with zero infrastructure; ORM makes models unit-testable |
| 3rd Party | Open-Meteo Weather API | Free and keyless — zero secrets to manage, rotate, or accidentally leak |
| Testing | Jest 30 + React Testing Library | ~320 self-contained tests run in CI; broken builds never reach Docker |
| Containers | Docker (3-stage multi-stage) | Alpine + non-root user nextjs:1001 — minimal image, minimal attack surface |
| CI/CD | GitHub Actions | push → test → audit → Docker package — no manual deploy steps ever |
| Observability | Prometheus + Grafana | 4 metrics, 5-panel SLO dashboard, zero external cloud dependency |

---

## ═══════════════════════════════════════════════════════════
## SLIDE 5 — Core Features
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Multi-Layer Defense and Seven Features Deliver Production-Grade Security"

**Evidence layout:** Two equal columns with a thin Steel Blue vertical divider.
Each column has a bold 13pt Navy section label at the top, then short evidence groups.
Section headers within each column are 13pt bold Navy. Body text is 13pt Dark Gray.

**LEFT COLUMN — "Auth & Security"**

Three token paths — one code path:
  API clients       JWT Bearer (1-hr expiry)
  Browser users     NextAuth session cookie
  OAuth users       /api/auth/token bridge
  One getAuthUser() handles all three transparently.

Brute force blocked at four layers:
  Rate limit: 5 auth requests / 15 min / IP
  bcrypt cost 12 → deliberate 200 ms+ per hash
  Token expiry limits stolen-token blast radius

Five security headers on every response:
  HSTS  |  X-Frame-Options: DENY  |  nosniff
  Owner BOLA check on all CRUD routes
  Sensitive keys stripped from all log output

**RIGHT COLUMN — "Data Features"**

Metrics CRUD — validated at every boundary:
  5 enum categories (server-enforced)
  UUID keys prevent ID enumeration attacks
  Admin sees ALL; users see only their own
  US format: 47,892 students  |  $2.1B USD

Weather — fetched once, cached ten minutes:
  Open-Meteo, Penn State coords (40.7983°N)
  US units: °F temperature, mph wind speed

Audit trail — every mutation, append-only:
  metric.created / updated / deleted
  Async write — does not slow API response
  Events are never modified — true audit log

---

## ═══════════════════════════════════════════════════════════
## SLIDE 6 — DevOps
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Every Commit Is Automatically Built, Tested, and Packaged — No Manual Steps"

**Evidence layout:** Two columns with a thin Steel Blue vertical divider.

**LEFT COLUMN — "CI/CD Pipeline (triggers on every push / PR to main)"**
The evidence IS the pipeline flow diagram. Render it as a clean vertical flowchart
on a light gray (#f5f5f5) background, Courier New font, dark gray text:

  push / PR to main
         │
    ┌────▼────────────────────────────┐
    │  JOB 1 — build-and-test         │
    │  npm ci  (lockfile-exact)        │
    │  npm run build                   │
    │  npm run test:coverage  ◄────────┼── QUALITY GATE
    │    no continue-on-error          │   failure stops here
    │  npm audit --audit-level=high    │
    └────┬────────────────────────────┘
         │  only if JOB 1 passes
    ┌────▼────────────────────────────┐
    │  JOB 2 — docker-build           │
    │  3-stage build (Alpine)          │
    │  non-root user nextjs:1001       │
    │  smoke test: curl /api/health×5  │
    └─────────────────────────────────┘

Use a box around "QUALITY GATE" text or highlight it in red to draw attention.

**RIGHT COLUMN — "Observability Stack"**
Section headers in 13pt bold Navy. Body text 12–13pt Dark Gray.

Three health endpoints — each has one role:
  /api/health        load balancer heartbeat (always 200)
  /api/health/live   Kubernetes liveness probe (always 200)
  /api/health/ready  readiness probe (503 if DB is down)

Structured JSON logging:
  {timestamp, level, message, …meta}
  password / token / secret — stripped on every write

Four Prometheus metric families:
  http_requests_total          traffic by route + status
  http_request_duration_ms     latency histogram
  metrics_created_total        domain KPI counter
  auth_logins_total            security event signal

Grafana: 5-panel dashboard, auto-provisioned on start
SLOs: availability ≥ 99.5%  |  p95 latency ≤ 500 ms
(render "SLOs" line as bold Navy)

---

## ═══════════════════════════════════════════════════════════
## SLIDE 7 — AI Audit
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"AI-Generated Code Contained 3 Security Flaws — All Caught by Manual Review"

**Evidence layout:** Two zones — a large audit table on top, and a narrow bar on the bottom.
The TABLE is the primary evidence.

**TOP ZONE — Audit Table (takes ~55% of the content area height)**
Label above table: "Evidence: AI Audit Findings (CI/CD YAML + Dockerfile)" in 13pt bold Navy.

3-column table:
- Header row: Navy background, white bold text
- 3 data rows with alternating Light Gray / White backgrounds
- Column widths: ~25% / ~40% / ~35%

| Flaw Found in AI Output | Risk if Shipped | Fix Applied |
|-------------------------|-----------------|-------------|
| Hard-coded JWT_SECRET in YAML ("supersecret123") | Credentials permanently visible in git history to anyone with repo access | ${{ secrets.JWT_SECRET \|\| 'safe-ci-fallback' }} referenced from GitHub Secrets |
| continue-on-error: true on the Jest test step | Failing tests produce a green pipeline; broken code gets packaged into Docker | Flag removed entirely — test failure now kills the pipeline (quality gate) |
| No USER directive in Dockerfile runtime stage | Container process runs as root; RCE exploit → attacker gets host root access | addgroup nodejs + adduser nextjs; USER nextjs (UID 1001) before CMD |

**BOTTOM ZONE — split into left (challenges) and right (lesson)**

Bottom-left: label "5 Technical Challenges Also Resolved" (13pt bold Navy), then 5 short lines (11pt Dark Gray):
  ESM/CJS interop  →  Next.js webpack layer
  Prometheus singleton lost on hot reload  →  global.__campusMetrics pattern
  sync(alter:true) wiped all data on restart  →  changed to sync()
  Middleware secret mismatch → auth loop  →  aligned 3-level fallback chains
  OAuth users got 401 on every API call  →  /api/auth/token bridge + JwtSynchronizer

Bottom-right: a clean call-out box (Light Gray background, subtle border) with this text centered:
  "AI optimizes for working code,
   not security defaults.
   Every AI-generated DevOps artifact
   needs a manual security review
   before commit."
  (13pt, Dark Gray, italic)

---

## ═══════════════════════════════════════════════════════════
## SLIDE 8 — Testing
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"320 Tests Across Three Isolation Layers Form a CI Quality Gate"

**Evidence layout:** Three equal columns with thin Steel Blue vertical dividers between them.
Each column has a 13pt bold Navy section label at the top.

**COLUMN 1 — "Unit Tests — 196 cases, 7 files"**
One line intro (12pt bold Navy): "Fast, isolated — no external dependencies"
Then pairs: file name (12pt Dark Gray) + one-line description (11pt Dark Gray, indented):

  auth.test.js
    JWT sign/verify, expiry edge cases
  validation.test.js
    All field constraints, enum values
  rateLimit.test.js
    Window reset, IP extraction, limits
  eventEmitter.test.js
    Domain event handlers, async flow
  apiErrors.test.js
    Error class hierarchy, HTTP codes
  weatherService.test.js
    Cache hits, coordinate validation
  middleware.test.js
    Security headers, auth redirect

**COLUMN 2 — "Frontend Tests — 124 cases, 7 files"**
One line intro (12pt bold Navy): "React Testing Library + jsdom — no browser"
Then pairs:

  LoginPage.test.js
    Form submit, errors, OAuth button
  MetricForm.test.js
    Validation messages, edit mode
  Navbar.test.js
    Auth-aware link rendering
  WeatherWidget.test.js
    Fetch, loading, error states
  AuthProvider.test.js
    NextAuth session wrapper
  apiClient.test.js
    Token injection, 401 redirect
  Spinner.test.js
    Loading UI component

**COLUMN 3 — "Integration + CI Enforcement"**
One line intro (12pt bold Navy): "Real HTTP calls against live server :3001"

  api.test.js  (Node --test runner)
    register → login
    → CRUD metrics (create/read/update/delete)
    → weather endpoint fetch
    → domain events table
    Run locally — require server on :3001

Then a visually separated box (Light Gray or subtle border) for the quality gate rule:
  CI quality gate:
    Jest runs on every push to main
    Pipeline FAILS if any test fails   ← render this line in Red (#c62828) bold
    Coverage report artifact (14 days)

---

## ═══════════════════════════════════════════════════════════
## SLIDE 9 — Reflections
## ═══════════════════════════════════════════════════════════

**Assertion (slide title):**
"Observability Must Be Designed In — Not Bolted On"

**Evidence layout:** Three equal columns with thin Steel Blue vertical dividers.

**COLUMN 1 — "Evidence: Built From Scratch"**
Section headers in 13pt bold Navy. Body 12pt Dark Gray.

Zero-dependency Prometheus module
  lib/metrics.js: 170 lines, pure Node.js
  No prom-client — implements text-format 0.0.4
  Global singleton survives hot reloads

Multi-layer auth with OAuth bridge
  JWT + NextAuth + /api/auth/token endpoint
  One getAuthUser() handles all three paths

Week 7 QA found bugs unit tests missed:
  sync(alter:true) silently wiped seed data
  Middleware secret mismatch → redirect loop
  Both found only via live end-to-end testing

**COLUMN 2 — "Evidence: Lessons That Transfer to Production"**

Log JSON before you ever need it
  Shared lib/logger.js made per-route logging
  a 2-line add — not a 15-file refactor

AI drafts; humans review for security
  3 flaws in AI-generated CI YAML
  2 infra bugs surfaced only in live QA
  Security review is non-negotiable

End-to-end testing finds what unit tests miss
  All 320 tests passed throughout development
  Runtime failures emerged only in the live app

Then a closing quote in a Light Gray call-out box (13pt, italic, Navy):
  "These patterns appear in every production
   system I will work on. This project gave me
   hands-on practice with all of them."

**COLUMN 3 — "Evidence: What Breaks at Scale"**

SQLite → PostgreSQL + connection pooling
  SQLite write-locks under concurrent load

In-memory rate limiter → Redis-backed
  State is lost on pod restart in Kubernetes

Single instance → Kubernetes + HPA
  Auto-scale on CPU / request-rate metrics

Developer experience gaps to close:
  OpenAPI/Swagger spec for all 15 routes
  Grafana alerts → PagerDuty / Slack

AI features planned:
  Natural language metric search
  Anomaly detection on time-series data

---
## END OF PROMPT FILE
## Paste DESIGN SYSTEM + one SLIDE section per Gemini request.
