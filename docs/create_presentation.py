"""
Campus Analytics Platform – SWENG 861 Presentation Generator
Generates a professional 9-slide PowerPoint presentation.
Run: python3 docs/create_presentation.py
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml import parse_xml
from lxml import etree

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NAVY   = RGBColor(0x1e, 0x3a, 0x5f)
STEEL  = RGBColor(0x21, 0x96, 0xf3)
LBLUE  = RGBColor(0x90, 0xca, 0xf9)
WHITE  = RGBColor(0xff, 0xff, 0xff)
LGRAY  = RGBColor(0xf0, 0xf4, 0xf8)
DGRAY  = RGBColor(0x33, 0x33, 0x33)
GREEN  = RGBColor(0x2e, 0x7d, 0x32)
MONO_BG = RGBColor(0xf5, 0xf5, 0xf5)

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "campus-analytics-presentation.pptx"
)

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def set_bg_color(slide, rgb_color):
    """Fill slide background with a solid color."""
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = rgb_color


def _set_cell_bg(cell, rgb_color):
    """Set background fill on a table cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    hex_str = '{:02X}{:02X}{:02X}'.format(rgb_color[0], rgb_color[1], rgb_color[2])
    solidFill = parse_xml(
        f'<a:solidFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        f'<a:srgbClr val="{hex_str}"/>'
        f'</a:solidFill>'
    )
    # Remove existing fill elements
    for existing in tcPr.findall(qn("a:solidFill")):
        tcPr.remove(existing)
    tcPr.insert(0, solidFill)


def add_rect(slide, left, top, width, height, fill_color, line_color=None):
    """Add a filled rectangle shape."""
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()
    return shape


def add_title_text(slide, text, left, top, width, height,
                   font_size=28, bold=True, color=WHITE,
                   alignment=PP_ALIGN.LEFT, italic=False):
    """Add a text box used for slide titles."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = alignment
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return txBox


def add_content_box(slide, text, left, top, width, height,
                    font_size=11, color=DGRAY, bg_color=None,
                    alignment=PP_ALIGN.LEFT, mono=False):
    """Add a multi-line text box with pre-formatted text."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    if bg_color:
        txBox.fill.solid()
        txBox.fill.fore_color.rgb = bg_color
    else:
        txBox.fill.background()

    lines = text.split("\n")
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.alignment = alignment

        # Indent detection
        stripped = line.lstrip()
        indent_level = len(line) - len(stripped)

        p.level = 0
        if indent_level >= 4:
            p.level = 2
        elif indent_level >= 2:
            p.level = 1

        run = p.add_run()
        run.text = stripped
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
        run.font.name = "Courier New" if mono else "Calibri"
        run.font.bold = False

        # Section headers (ALL CAPS lines without bullets)
        if stripped and stripped == stripped.upper() and not stripped.startswith("•") \
                and not stripped.startswith("✓") and not stripped.startswith("→") \
                and not stripped.startswith("GET") and not stripped.startswith("1.") \
                and not stripped.startswith("2.") and not stripped.startswith("3.") \
                and len(stripped) > 2 and not stripped.startswith("│") \
                and not stripped.startswith("┌") and not stripped.startswith("└") \
                and not stripped.startswith("┘") and not stripped.startswith("─") \
                and not stripped.startswith("#"):
            run.font.bold = True
            run.font.color.rgb = NAVY

    return txBox


def add_col_header(slide, text, left, top, width, height, color=NAVY):
    """Add a small section header (sub-column title)."""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = text
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = color
    run.font.name = "Calibri"
    return txBox


def add_table(slide, headers, rows, left, top, width, height):
    """Add a formatted table with a navy header row."""
    num_rows = len(rows) + 1  # +1 for header
    num_cols = len(headers)
    table = slide.shapes.add_table(num_rows, num_cols, left, top, width, height).table

    # Column widths
    col_widths = [Inches(1.8), Inches(2.8), Inches(4.2)]
    for i, w in enumerate(col_widths[:num_cols]):
        table.columns[i].width = w

    # Header row
    for col_idx, header in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = header
        _set_cell_bg(cell, NAVY)
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.runs[0]
        run.font.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(11)
        run.font.name = "Calibri"

    # Data rows
    for row_idx, row in enumerate(rows):
        bg = LGRAY if row_idx % 2 == 0 else WHITE
        for col_idx, cell_text in enumerate(row):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = cell_text
            _set_cell_bg(cell, bg)
            p = cell.text_frame.paragraphs[0]
            run = p.runs[0]
            run.font.size = Pt(10)
            run.font.name = "Calibri"
            run.font.color.rgb = DGRAY
            if col_idx == 0:
                run.font.bold = True
                run.font.color.rgb = NAVY

    return table


def add_slide_header(slide, title_text):
    """Add the standard navy accent bar + title for content slides."""
    # Top accent bar (full width, thin)
    add_rect(slide, Inches(0), Inches(0), SLIDE_W, Inches(0.08), NAVY)
    # Left accent bar
    add_rect(slide, Inches(0), Inches(0.08), Inches(0.06), Inches(1.1), STEEL)
    # Title background
    add_rect(slide, Inches(0.06), Inches(0.08), Inches(13.27), Inches(1.0), LGRAY)
    # Title text
    add_title_text(slide, title_text,
                   Inches(0.3), Inches(0.1), Inches(12.7), Inches(1.0),
                   font_size=26, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT)
    # Bottom accent line
    add_rect(slide, Inches(0), Inches(7.42), SLIDE_W, Inches(0.08), NAVY)


# ---------------------------------------------------------------------------
# Slide builders
# ---------------------------------------------------------------------------

def build_slide1(prs):
    """Title slide – full navy background."""
    slide_layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(slide_layout)
    set_bg_color(slide, NAVY)

    # Decorative accent bar
    add_rect(slide, Inches(0), Inches(3.1), SLIDE_W, Inches(0.05), STEEL)

    # Title
    add_title_text(slide, "Campus Analytics Platform",
                   Inches(0.5), Inches(1.6), Inches(12.3), Inches(1.5),
                   font_size=44, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

    # Subtitle
    add_title_text(slide, "SWENG 861 – Software Construction  |  Spring 2026",
                   Inches(0.5), Inches(3.2), Inches(12.3), Inches(0.9),
                   font_size=22, bold=False, color=LBLUE, alignment=PP_ALIGN.CENTER)

    # Author
    add_title_text(slide, "Jomar Thomas Almonte",
                   Inches(0.5), Inches(4.2), Inches(12.3), Inches(0.7),
                   font_size=20, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

    # Institution
    add_title_text(slide, "Pennsylvania State University",
                   Inches(0.5), Inches(4.9), Inches(12.3), Inches(0.6),
                   font_size=15, bold=False, color=LBLUE, alignment=PP_ALIGN.CENTER)

    return slide


def build_slide2(prs):
    """Requirements & Success Criteria."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Requirements & Success Criteria")

    content = """\
PROBLEM
  • Universities lack a unified platform to track cross-domain campus metrics
  • Manual tracking in spreadsheets creates data silos and reporting delays

USERS & SCENARIOS
  • Faculty – track enrollment trends and academic KPIs
  • Department heads – monitor facilities and financial metrics
  • Administrators – oversee all domains with audit trail

CORE FEATURES (✓ = implemented)
  ✓ Secure CRUD API for campus metrics (5 categories)
  ✓ JWT + Google OAuth 2.0 authentication
  ✓ Real-time weather integration (Open-Meteo API)
  ✓ Domain event audit trail
  ✓ Containerized deployment (Docker + CI/CD)
  ✓ Observability dashboard (Prometheus + Grafana)

NON-FUNCTIONAL REQUIREMENTS
  • Security: OWASP Top 10 mitigations, HSTS, bcrypt
  • Reliability: health checks, structured logging, SLOs
  • Testability: ≥320 automated tests (unit + component + integration)"""

    add_content_box(slide, content,
                    Inches(0.25), Inches(1.2), Inches(12.8), Inches(6.1),
                    font_size=12, color=DGRAY)
    return slide


def build_slide3(prs):
    """Design & Architecture – two columns."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Design & Architecture")

    left_text = """\
Architecture: 3-Tier MVC

FRONTEND LAYER
  • Next.js 15 App Router (SSR)
  • React 19 + TailwindCSS 4
  • 5 pages: Dashboard, Login, Metrics List/Detail, Create

API LAYER (Next.js Route Handlers)
  • 15 API route files
  • JWT Bearer + NextAuth session auth
  • 4-tier rate limiting (in-memory)
  • Input validation + BOLA prevention

DATA LAYER
  • SQLite + Sequelize ORM
  • 4 models: User, Metric, WeatherData, DomainEvent
  • Associations with CASCADE delete

EXTERNAL INTEGRATIONS
  • Open-Meteo API (free weather, no key required)
  • Google OAuth 2.0 (optional)"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.2), Inches(5.8), Inches(6.1),
                    font_size=11, color=DGRAY)

    diagram = """\
┌──────────────────────────────────┐
│  Browser (React 19 + Next.js 15) │
│  Dashboard | Login | Metrics     │
│  Weather Widget | Forms          │
└─────────────────┬────────────────┘
                  │ HTTPS/JWT
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
└─────────────────────────────────┘"""

    add_content_box(slide, diagram,
                    Inches(6.3), Inches(1.2), Inches(6.8), Inches(6.1),
                    font_size=9.5, color=DGRAY, bg_color=MONO_BG, mono=True)
    return slide


def build_slide4(prs):
    """Technology Stack – table."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Technology Stack")

    headers = ["Layer", "Technology", "Key Benefit"]
    rows = [
        ["Frontend",       "Next.js 15 App Router",    "SSR + API routes in one framework"],
        ["UI",             "React 19 + TailwindCSS 4", "Responsive, utility-first styling"],
        ["Authentication", "NextAuth 4 + JWT",          "Browser sessions + API token auth"],
        ["Database",       "SQLite + Sequelize 6",      "Zero-config ORM, 4 relational models"],
        ["3rd Party",      "Open-Meteo Weather API",    "Free, no key, cached 10 minutes"],
        ["Testing",        "Jest 30 + RTL",             "~320 test cases, CI coverage reporting"],
        ["Containers",     "Docker (3-stage build)",    "Non-root user, Alpine, health check"],
        ["CI/CD",          "GitHub Actions",            "build → test → Docker package"],
        ["Observability",  "Prometheus + Grafana",      "4 metric families, 5-panel dashboard"],
    ]

    add_table(slide, headers, rows,
              Inches(0.25), Inches(1.25), Inches(12.83), Inches(6.0))
    return slide


def build_slide5(prs):
    """Core Features – two columns."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Core Features")

    add_col_header(slide, "Security & Auth",
                   Inches(0.25), Inches(1.15), Inches(6.2), Inches(0.35))

    left_text = """\
AUTHENTICATION
  • JWT Bearer tokens (1-hour expiry)
  • Google OAuth 2.0 (NextAuth.js)
  • bcrypt password hashing (cost 12)
  • Rate limiting: 5 auth req / 15 min
  • OAuth JWT bridge: /api/auth/token
    → ensures OAuth users can call APIs
  • superadmin master account (seed)

SECURITY MEASURES
  • HSTS, X-Frame-Options: DENY
  • X-Content-Type-Options: nosniff
  • Owner-based access control (BOLA prevention)
  • Input validation (server + client-side)
  • Sensitive keys never logged"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.52), Inches(6.2), Inches(5.8),
                    font_size=11.5, color=DGRAY)

    add_col_header(slide, "Metrics & Integrations",
                   Inches(6.7), Inches(1.15), Inches(6.4), Inches(0.35))

    right_text = """\
METRICS CRUD
  • 5 categories: enrollment, facilities,
    academic, financial, other
  • UUID primary keys, paginated lists
  • Admin sees ALL metrics (master view)
  • US number formatting with commas
  • USD values prefixed with $

WEATHER INTEGRATION
  • Open-Meteo API (Penn State: 40.7983°N)
  • Temperature in °F, wind speed in mph
  • 10-minute in-memory cache

DOMAIN EVENTS
  • Async audit trail for all mutations
  • Events: metric.created/updated/deleted
  • Stored in DB with status tracking"""

    add_content_box(slide, right_text,
                    Inches(6.7), Inches(1.52), Inches(6.4), Inches(5.8),
                    font_size=11.5, color=DGRAY)

    # Divider
    add_rect(slide, Inches(6.55), Inches(1.15), Inches(0.05), Inches(6.2), STEEL)
    return slide


def build_slide6(prs):
    """DevOps & Observability."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "DevOps & Observability (Week 6)")

    add_col_header(slide, "CI/CD Pipeline",
                   Inches(0.25), Inches(1.15), Inches(6.2), Inches(0.35))

    left_text = """\
GitHub Actions (.github/workflows/ci.yml)
Triggers on every push/PR to main

JOB 1: BUILD-AND-TEST
  1. npm ci (clean install)
  2. npm run build (Next.js standalone)
  3. npm run test:coverage ← BLOCKS pipeline
  4. npm audit --audit-level=high

JOB 2: DOCKER-BUILD (needs job 1)
  1. Build campus-analytics:<sha>
  2. Smoke test: curl /api/health × 5

DOCKER: 3-STAGE MULTI-STAGE BUILD
  • Stage 1: npm ci (deps)
  • Stage 2: npm run build (builder)
  • Stage 3: Alpine, non-root nextjs:1001"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.52), Inches(6.2), Inches(5.8),
                    font_size=11, color=DGRAY)

    add_col_header(slide, "Observability Stack",
                   Inches(6.7), Inches(1.15), Inches(6.4), Inches(0.35))

    right_text = """\
HEALTH ENDPOINTS
  GET /api/health       → {status, db, uptime}
  GET /api/health/live  → always 200
  GET /api/health/ready → 200 or 503

STRUCTURED LOGGING (lib/logger.js)
  • JSON: {timestamp, level, message, ...meta}
  • Strips: password, token, secret, authorization
  • debug suppressed in production

PROMETHEUS METRICS (lib/metrics.js)
  • http_requests_total {method, route, status}
  • http_request_duration_ms histogram
  • metrics_created_total (domain KPI)
  • auth_logins_total {success|failure}

GRAFANA DASHBOARD (5 panels, auto-provisioned)
  • Request Rate | Error Rate | p95 Latency
  • Domain KPI | Auth Activity

SLOs: Availability ≥99.5% | p95 ≤500ms"""

    add_content_box(slide, right_text,
                    Inches(6.7), Inches(1.52), Inches(6.4), Inches(5.8),
                    font_size=11, color=DGRAY)

    add_rect(slide, Inches(6.55), Inches(1.15), Inches(0.05), Inches(6.2), STEEL)
    return slide


def build_slide7(prs):
    """Challenges & AI/GenAI Audit."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Challenges & AI/GenAI Audit")

    # Section 1
    add_col_header(slide, "Technical Challenges",
                   Inches(0.25), Inches(1.15), Inches(4.1), Inches(0.3), color=NAVY)

    s1 = """\
1. Next.js ESM/CJS Interop
   lib/ uses CommonJS (module.exports)
   app/api/ uses ESM (import/export)
   → Resolved via Next.js webpack interop layer

2. Prometheus Singleton Across Hot Reloads
   Next.js re-evaluates modules in dev mode
   → Fixed: global.__campusMetrics pattern

3. SQLite Data Wipe via sync({ alter: true })
   Sequelize recreates ENUM tables on restart
   → Fixed: changed to sync() in ensureDb()

4. Middleware Secret Mismatch → Auth Loop
   middleware.js had no NEXTAUTH_SECRET fallback
   NextAuth used 3-level fallback chain
   → Fixed: aligned fallback chains; added .env.local

5. OAuth JWT Gap → 401 on API calls
   Google OAuth users had no Bearer token
   → Fixed: /api/auth/token bridge + JwtSynchronizer"""

    add_content_box(slide, s1,
                    Inches(0.25), Inches(1.5), Inches(4.1), Inches(5.85),
                    font_size=10.5, color=DGRAY)

    add_rect(slide, Inches(4.5), Inches(1.15), Inches(0.04), Inches(6.2), STEEL)

    # Section 2
    add_col_header(slide, "AI/GenAI Audit – 3 Issues Found & Fixed",
                   Inches(4.65), Inches(1.15), Inches(5.3), Inches(0.3), color=NAVY)

    s2 = """\
ISSUE #1: Hard-coded secrets in CI YAML
  Original: JWT_SECRET: "supersecret123"
  Risk: credentials exposed in git history
  Fix: ${{ secrets.JWT_SECRET || 'safe-ci-fallback' }}

ISSUE #2: continue-on-error: true on test step
  Original: tests "pass" even when all fail
  Risk: broken code packaged into Docker images
  Fix: removed continue-on-error entirely

ISSUE #3: Docker runtime running as root
  Original: no USER directive in Dockerfile
  Risk: container escape → host root access
  Fix: addgroup nodejs + adduser nextjs; USER nextjs"""

    add_content_box(slide, s2,
                    Inches(4.65), Inches(1.5), Inches(5.3), Inches(4.6),
                    font_size=10.5, color=DGRAY)

    add_rect(slide, Inches(10.1), Inches(1.15), Inches(0.04), Inches(6.2), STEEL)

    # Section 3
    add_col_header(slide, "Lesson Learned",
                   Inches(10.2), Inches(1.15), Inches(3.0), Inches(0.3), color=NAVY)

    s3 = """\
AI tools optimize for
"working code" —
not security defaults.

Every AI-generated
DevOps artifact needs
a security-first review.

Treat AI output as a
first draft, not
production-ready code."""

    add_content_box(slide, s3,
                    Inches(10.2), Inches(1.5), Inches(3.0), Inches(5.85),
                    font_size=11, color=DGRAY)

    return slide


def build_slide8(prs):
    """Testing Strategy."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Testing Strategy (~320 Test Cases)")

    col_w = Inches(4.2)
    gap = Inches(0.15)

    titles = [
        "Unit Tests (196 cases, 7 files)",
        "Frontend Tests (124 cases, 7 files)",
        "Integration & CI",
    ]
    contents = [
        """\
auth.test.js
  JWT sign/verify, expiry, edge cases
validation.test.js
  All field constraints, enum values
rateLimit.test.js
  Window reset, IP extraction, limits
eventEmitter.test.js
  Domain event handlers, async flow
apiErrors.test.js
  Error class hierarchy, HTTP codes
weatherService.test.js
  Cache hits, coord validation
middleware.test.js
  Security headers, auth redirect""",

        """\
LoginPage.test.js
  Form submit, error states, OAuth button
MetricForm.test.js
  Validation, submit, edit mode
Navbar.test.js
  Logout, auth-aware link rendering
WeatherWidget.test.js
  Fetch, loading state, error handling
AuthProvider.test.js
  NextAuth session wrapper
apiClient.test.js
  Token injection, 401 handling
Spinner.test.js
  Loading UI component""",

        """\
api.test.js (Node --test runner)
  Full HTTP cycle:
  register → login
  → CRUD metrics
  → weather fetch
  → domain events
  Runs locally (server :3001)

CI/CD
  Jest coverage on every push
  Fails pipeline if test fails
  Coverage report as artifact
  14-day retention""",
    ]

    for i, (title, text) in enumerate(zip(titles, contents)):
        left = Inches(0.2) + i * (col_w + gap)
        add_col_header(slide, title, left, Inches(1.15), col_w, Inches(0.35))
        add_content_box(slide, text, left, Inches(1.52), col_w, Inches(5.85),
                        font_size=10.5, color=DGRAY)

        if i < 2:
            add_rect(slide,
                     left + col_w + Inches(0.05),
                     Inches(1.15),
                     Inches(0.04),
                     Inches(6.2),
                     STEEL)

    return slide


def build_slide9(prs):
    """Reflections & Future Work."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide, "Reflections & Future Work")

    col_w = Inches(4.2)
    gap = Inches(0.15)

    titles = [
        "What I'm Most Proud Of",
        "Lessons Learned",
        "Future Work",
    ]
    contents = [
        """\
• Zero-dependency Prometheus metrics
  No prom-client needed; pure Node.js
  Correct Prometheus text format 0.0.4

• Multi-layer auth + OAuth bridge
  NextAuth sessions + JWT Bearer tokens
  /api/auth/token bridge for OAuth users
  Both work seamlessly

• Week 7 QA revealed subtle infra bugs
  sync(alter:true) silently wiping data
  Middleware secret chain misalignment
  Fixed through systematic root-cause work""",

        """\
• Structured logging pays dividends
  JSON logs are machine-parseable
  Sensitive-key sanitization prevents
  accidental exposure

• Observability must be designed-in
  Plan for health checks, metrics,
  and logging from day one

• AI tools are drafting tools
  3 security issues in CI YAML
  2 infrastructure bugs via QA review
  Security review is non-negotiable

• End-to-end QA is essential
  Unit tests passed; runtime failures
  surface during real app usage""",

        """\
SCALE & PERFORMANCE
  • PostgreSQL + connection pooling
  • Redis-backed rate limiter
  • Kubernetes + HPA auto-scaling

DEVELOPER EXPERIENCE
  • OpenAPI/Swagger spec
  • Grafana alerts (PagerDuty/Slack)

AI FEATURES
  • Natural language metric search
  • Anomaly detection on time series
  • AI-assisted report generation

"The CI/CD, observability, and auth
 patterns built here appear in every
 production system. This project gave
 me hands-on practice with the full
 DevOps lifecycle." """,
    ]

    for i, (title, text) in enumerate(zip(titles, contents)):
        left = Inches(0.2) + i * (col_w + gap)
        add_col_header(slide, title, left, Inches(1.15), col_w, Inches(0.35))
        add_content_box(slide, text, left, Inches(1.52), col_w, Inches(5.85),
                        font_size=10.5, color=DGRAY)

        if i < 2:
            add_rect(slide,
                     left + col_w + Inches(0.05),
                     Inches(1.15),
                     Inches(0.04),
                     Inches(6.2),
                     STEEL)

    return slide


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main():
    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H

    print("Building slides...")
    build_slide1(prs)
    print("  [1/9] Title slide")
    build_slide2(prs)
    print("  [2/9] Requirements & Success Criteria")
    build_slide3(prs)
    print("  [3/9] Design & Architecture")
    build_slide4(prs)
    print("  [4/9] Technology Stack")
    build_slide5(prs)
    print("  [5/9] Core Features")
    build_slide6(prs)
    print("  [6/9] DevOps & Observability")
    build_slide7(prs)
    print("  [7/9] Challenges & AI/GenAI Audit")
    build_slide8(prs)
    print("  [8/9] Testing Strategy")
    build_slide9(prs)
    print("  [9/9] Reflections & Future Work")

    prs.save(OUTPUT_PATH)
    size_bytes = os.path.getsize(OUTPUT_PATH)
    size_kb    = size_bytes / 1024
    print(f"\nPresentation saved successfully!")
    print(f"  Path : {OUTPUT_PATH}")
    print(f"  Size : {size_kb:.1f} KB ({size_bytes:,} bytes)")


if __name__ == "__main__":
    main()
