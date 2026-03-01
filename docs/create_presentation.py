"""
Campus Analytics Platform – SWENG 861 Presentation Generator
Generates a professional 9-slide PowerPoint presentation.
Run: python3 docs/create_presentation.py

Slide format: Assertion-Evidence
  - Slide TITLE  = the core claim (assertion)
  - Slide BODY   = evidence that proves the claim
  - Section hdrs = mini-assertions (ALL CAPS triggers bold+navy styling)
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

        # Section headers: ALL CAPS lines become bold navy (assertion sub-headers)
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

    col_widths = [Inches(1.5), Inches(2.5), Inches(8.83)]
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
    """Add the standard navy accent bar + assertion title for content slides."""
    add_rect(slide, Inches(0), Inches(0), SLIDE_W, Inches(0.08), NAVY)
    add_rect(slide, Inches(0), Inches(0.08), Inches(0.06), Inches(1.1), STEEL)
    add_rect(slide, Inches(0.06), Inches(0.08), Inches(13.27), Inches(1.0), LGRAY)
    add_title_text(slide, title_text,
                   Inches(0.3), Inches(0.1), Inches(12.7), Inches(1.0),
                   font_size=24, bold=True, color=NAVY, alignment=PP_ALIGN.LEFT)
    add_rect(slide, Inches(0), Inches(7.42), SLIDE_W, Inches(0.08), NAVY)


# ---------------------------------------------------------------------------
# Slide builders — Assertion-Evidence format
# Each slide title IS the assertion. The body proves it.
# ---------------------------------------------------------------------------

def build_slide1(prs):
    """Title slide – full navy background."""
    slide_layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(slide_layout)
    set_bg_color(slide, NAVY)

    add_rect(slide, Inches(0), Inches(3.1), SLIDE_W, Inches(0.05), STEEL)

    add_title_text(slide, "Campus Analytics Platform",
                   Inches(0.5), Inches(1.6), Inches(12.3), Inches(1.5),
                   font_size=44, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

    add_title_text(slide, "SWENG 861 – Software Construction  |  Spring 2026",
                   Inches(0.5), Inches(3.2), Inches(12.3), Inches(0.9),
                   font_size=22, bold=False, color=LBLUE, alignment=PP_ALIGN.CENTER)

    add_title_text(slide, "Jomar Thomas Almonte",
                   Inches(0.5), Inches(4.2), Inches(12.3), Inches(0.7),
                   font_size=20, bold=True, color=WHITE, alignment=PP_ALIGN.CENTER)

    add_title_text(slide, "Pennsylvania State University",
                   Inches(0.5), Inches(4.9), Inches(12.3), Inches(0.6),
                   font_size=15, bold=False, color=LBLUE, alignment=PP_ALIGN.CENTER)

    return slide


def build_slide2(prs):
    """Assertion: Campus Analytics Eliminates University Metrics Data Silos"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Campus Analytics Eliminates University Metrics Data Silos")

    content = """\
THE PROBLEM: SPREADSHEET TRACKING CREATES THREE FAILURES
  • No single source of truth — departments work from different versions
  • No audit trail — no record of who changed what, or when
  • No access control — anyone with the file can view or modify everything

WHO IT AFFECTS
  • Faculty: need enrollment trends and academic performance KPIs in one place
  • Department heads: track facilities, financial, and operational metrics
  • Administrators: require cross-domain oversight with an append-only audit trail

SEVEN FEATURES IMPLEMENTED — ALL IN PRODUCTION
  ✓ JWT + Google OAuth authentication with bcrypt hashing and rate limiting
  ✓ 5-category CRUD API for campus metrics with admin master view
  ✓ Live weather widget in °F/mph, sourced from Penn State's GPS coordinates
  ✓ Domain event audit trail written on every metric create/update/delete
  ✓ Prometheus + Grafana observability dashboard (4 metrics, 5 panels)
  ✓ GitHub Actions CI/CD pipeline: build → test → Docker package
  ✓ Non-root Docker image with 3-stage multi-stage build

NON-FUNCTIONAL REQUIREMENTS MET — NOT ASPIRATIONAL
  • Security: OWASP Top 10 mitigations applied (HSTS, BOLA, bcrypt, rate limits)
  • Reliability: SLOs defined — availability ≥99.5%, p95 latency ≤500ms
  • Testing: 320 automated tests block any broken build in CI"""

    add_content_box(slide, content,
                    Inches(0.25), Inches(1.2), Inches(12.8), Inches(6.1),
                    font_size=11.5, color=DGRAY)
    return slide


def build_slide3(prs):
    """Assertion: Next.js 15 Collapses Frontend and API Into One Deploy Unit"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Next.js 15 Collapses Frontend and API Into One Deploy Unit")

    left_text = """\
WHY ONE FRAMEWORK: ZERO SPLIT-DEPLOY COMPLEXITY
  Next.js hosts both the React UI and 15 API
  route handlers in a single Docker image.
  No CORS headers, no two repos, no separate
  API server to provision or scale separately.

FRONTEND: SERVER-RENDERED, ALWAYS FAST
  • Next.js 15 App Router (SSR, App Router)
  • React 19 + TailwindCSS 4 (utility-first)
  • 5 pages: Dashboard, Login, Metrics, Create, Edit

API LAYER: VALIDATED AND RATE-LIMITED
  • 15 route handlers on Node.js
  • JWT Bearer + NextAuth session auth
  • 4-tier rate limiting (in-memory, per IP)
  • Input validation + BOLA owner-check

DATA LAYER: ZERO-CONFIG, RELATIONAL
  • SQLite + Sequelize ORM (4 models)
  • User, Metric, WeatherData, DomainEvent
  • CASCADE deletes enforce referential integrity

EXTERNAL: FREE WEATHER, NO SECRETS TO MANAGE
  • Open-Meteo (keyless weather API)
  • Google OAuth 2.0 via NextAuth (optional)"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.2), Inches(5.8), Inches(6.1),
                    font_size=11, color=DGRAY)

    diagram = """\
┌──────────────────────────────────┐
│  Browser (React 19 + Next.js 15) │
│  Dashboard | Login | Metrics     │
│  Weather Widget | Forms          │
└─────────────────┬────────────────┘
                  │ HTTPS / JWT Bearer
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
    """Assertion: Technology Choices Minimize Overhead and Maximize Testability"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Technology Choices Minimize Overhead and Maximize Testability")

    headers = ["Layer", "Technology", "Evidence: Why This Choice Delivers That Outcome"]
    rows = [
        ["Frontend",       "Next.js 15 App Router",
         "SSR + API routes in one deploy — eliminates split frontend/backend overhead"],
        ["UI",             "React 19 + TailwindCSS 4",
         "Utility-first styling removes custom CSS maintenance entirely"],
        ["Authentication", "NextAuth 4 + JWT",
         "Browser sessions + API tokens handled by one getAuthUser() function"],
        ["Database",       "SQLite + Sequelize 6",
         "File-based DB needs zero infrastructure; ORM makes models unit-testable"],
        ["3rd Party",      "Open-Meteo Weather API",
         "Free and keyless — zero secrets to manage, rotate, or leak"],
        ["Testing",        "Jest 30 + React Testing Library",
         "~320 self-contained tests run in CI — broken builds never ship"],
        ["Containers",     "Docker (3-stage multi-stage build)",
         "Alpine + non-root user nextjs:1001 minimizes attack surface"],
        ["CI/CD",          "GitHub Actions",
         "push → test → audit → Docker package — zero manual steps"],
        ["Observability",  "Prometheus + Grafana",
         "4 metric families power SLO dashboards; zero external dependency"],
    ]

    add_table(slide, headers, rows,
              Inches(0.25), Inches(1.25), Inches(12.83), Inches(6.0))
    return slide


def build_slide5(prs):
    """Assertion: Multi-Layer Defense Delivers 7 Production-Grade Campus Features"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Multi-Layer Defense Delivers 7 Production-Grade Campus Features")

    add_col_header(slide, "Security & Authentication",
                   Inches(0.25), Inches(1.15), Inches(6.2), Inches(0.35))

    left_text = """\
TWO TOKEN TYPES — ONE GETAUTHUSER() CODE PATH
  • API clients: JWT Bearer tokens (1-hr expiry)
  • Browser users: NextAuth encrypted session cookies
  • OAuth JWT bridge: /api/auth/token
    → Google OAuth users get a JWT automatically
  • Single getAuthUser() checks both; routes are unaware

BRUTE FORCE IS BLOCKED BEFORE IT REACHES THE DB
  • Rate limit: 5 auth requests per 15-min per IP
  • bcrypt cost 12 — deliberate 200ms+ hash time
  • Stolen tokens expire in 1 hour, limiting blast radius

FIVE SECURITY HEADERS ON EVERY RESPONSE
  • HSTS — forces HTTPS on all connections
  • X-Frame-Options: DENY — no clickjacking
  • X-Content-Type-Options: nosniff
  • Owner-based BOLA check on all CRUD routes
  • Sensitive keys stripped from all log output"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.52), Inches(6.2), Inches(5.8),
                    font_size=11.5, color=DGRAY)

    add_col_header(slide, "Features & Data Management",
                   Inches(6.7), Inches(1.15), Inches(6.4), Inches(0.35))

    right_text = """\
METRICS CRUD VALIDATES AT SERVER AND CLIENT
  • 5 enum categories: enrollment, facilities,
    academic, financial, other
  • UUID primary keys prevent ID enumeration attacks
  • Admin sees ALL metrics; users see only their own
  • US formatting: 47,892 students | $2,100,000,000 USD

WEATHER IS FETCHED ONCE, CACHED TEN MINUTES
  • Open-Meteo API (Penn State: 40.7983°N, 77.8599°W)
  • US units: °F temperature, mph wind speed
  • In-memory cache prevents redundant external API hits

EVERY MUTATION PRODUCES AN APPEND-ONLY AUDIT
  • DomainEvent table records metric.created/
    updated/deleted with full payload
  • Async write — does not slow down API response
  • Events are never modified — true audit trail"""

    add_content_box(slide, right_text,
                    Inches(6.7), Inches(1.52), Inches(6.4), Inches(5.8),
                    font_size=11.5, color=DGRAY)

    add_rect(slide, Inches(6.55), Inches(1.15), Inches(0.05), Inches(6.2), STEEL)
    return slide


def build_slide6(prs):
    """Assertion: Every Commit Is Automatically Built, Tested, and Packaged"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Every Commit Is Automatically Built, Tested, and Packaged")

    add_col_header(slide, "CI/CD Pipeline — Quality Gate Enforced",
                   Inches(0.25), Inches(1.15), Inches(6.2), Inches(0.35))

    left_text = """\
PIPELINE TRIGGER: EVERY PUSH OR PR TO MAIN

JOB 1 — BUILD AND TEST (BLOCKS JOB 2 IF IT FAILS)
  1. npm ci — reproducible, lockfile-exact install
  2. npm run build — Next.js standalone output
  3. npm run test:coverage — NO continue-on-error
     → single test failure kills the pipeline here
  4. npm audit --audit-level=high — rejects CVEs
  5. Coverage artifact retained 14 days

BROKEN CODE CANNOT REACH THE DOCKER BUILD STAGE
  → The test step has no continue-on-error flag
  → This is the non-negotiable quality gate

JOB 2 — DOCKER BUILD (ONLY AFTER JOB 1 PASSES)
  1. 3-stage build: deps → builder → Alpine runtime
  2. Non-root user nextjs:1001 — never runs as root
  3. Smoke test: curl /api/health × 5 retries
     → Pipeline fails if health endpoint is silent"""

    add_content_box(slide, left_text,
                    Inches(0.25), Inches(1.52), Inches(6.2), Inches(5.8),
                    font_size=11, color=DGRAY)

    add_col_header(slide, "Observability Stack — Three Layers of Signal",
                   Inches(6.7), Inches(1.15), Inches(6.4), Inches(0.35))

    right_text = """\
THREE HEALTH ENDPOINTS — EACH HAS A SPECIFIC ROLE
  GET /api/health  → load balancer heartbeat
    {status, db, uptime, version} — always HTTP 200
  GET /api/health/live  → Kubernetes liveness probe
    always 200 while Node.js process is alive
  GET /api/health/ready → Kubernetes readiness probe
    503 if DB unreachable — stops traffic routing

LOGS ARE JSON — MACHINE-PARSEABLE BY DEFAULT
  • {timestamp, level, message, ...metadata}
  • password/token/secret/auth — stripped always
  • Debug logs suppressed in production builds
  • Cloud aggregators (Datadog, Stackdriver) ingest directly

FOUR METRIC FAMILIES EXPOSE ACTIONABLE SIGNAL
  • http_requests_total — traffic by route + status
  • http_request_duration_ms — latency histogram
  • metrics_created_total — domain KPI counter
  • auth_logins_total — security event signal

GRAFANA SLOS: AVAILABILITY ≥99.5% | P95 ≤500MS
  5-panel dashboard auto-provisioned on docker-compose up"""

    add_content_box(slide, right_text,
                    Inches(6.7), Inches(1.52), Inches(6.4), Inches(5.8),
                    font_size=11, color=DGRAY)

    add_rect(slide, Inches(6.55), Inches(1.15), Inches(0.05), Inches(6.2), STEEL)
    return slide


def build_slide7(prs):
    """Assertion: AI Code Had 3 Security Flaws — All Caught by Manual Review"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "AI Code Had 3 Security Flaws — All Caught by Manual Review")

    add_col_header(slide, "5 Technical Challenges — Root Cause Found and Fixed",
                   Inches(0.25), Inches(1.15), Inches(4.1), Inches(0.3), color=NAVY)

    s1 = """\
CHALLENGE 1: ESM/CJS MODULE INTEROP
  lib/ uses CommonJS (module.exports)
  app/api/ uses ESM (import/export)
  → Resolved via Next.js webpack interop layer

CHALLENGE 2: PROMETHEUS LOST ON HOT RELOAD
  Next.js re-evaluates modules in dev mode
  → Fixed: global.__campusMetrics singleton pattern

CHALLENGE 3: SYNC(ALTER:TRUE) WIPED ALL DATA
  Sequelize drops+recreates ENUM tables on restart
  → Fixed: changed to sync() in ensureDb()
  Evidence: 20 seed metrics → 0 after restart

CHALLENGE 4: MIDDLEWARE SECRET MISMATCH
  middleware.js: no NEXTAUTH_SECRET fallback
  NextAuth handler: 3-level fallback chain
  → Every request redirected to login (undefined key)
  → Fixed: aligned chains; created .env.local

CHALLENGE 5: OAUTH USERS GOT 401 ON API CALLS
  Google OAuth creates session, not a JWT
  apiClient.js reads from localStorage — gets null
  → Fixed: /api/auth/token bridge + JwtSynchronizer"""

    add_content_box(slide, s1,
                    Inches(0.25), Inches(1.5), Inches(4.1), Inches(5.85),
                    font_size=10.5, color=DGRAY)

    add_rect(slide, Inches(4.5), Inches(1.15), Inches(0.04), Inches(6.2), STEEL)

    add_col_header(slide, "AI Audit — 3 Security Flaws in Generated CI/CD Code",
                   Inches(4.65), Inches(1.15), Inches(5.3), Inches(0.3), color=NAVY)

    s2 = """\
FLAW 1: HARD-CODED SECRETS IN CI YAML
  AI generated: JWT_SECRET: "supersecret123"
  Risk: credentials exposed in git history forever;
    any repo contributor can read the value
  Fix: ${{ secrets.JWT_SECRET || 'safe-ci-fallback' }}

FLAW 2: TESTS ALWAYS PASS — CONTINUE-ON-ERROR
  AI generated: continue-on-error: true on test step
  Risk: failing tests still produce a green pipeline;
    broken code gets packaged into Docker images
  Fix: removed flag — test failure kills the pipeline

FLAW 3: DOCKER CONTAINER RUNNING AS ROOT
  AI generated: no USER directive in Dockerfile
  Risk: RCE exploit in any dependency → attacker
    lands as root → container escape to host
  Fix: addgroup nodejs + adduser nextjs; USER nextjs"""

    add_content_box(slide, s2,
                    Inches(4.65), Inches(1.5), Inches(5.3), Inches(4.6),
                    font_size=10.5, color=DGRAY)

    add_rect(slide, Inches(10.1), Inches(1.15), Inches(0.04), Inches(6.2), STEEL)

    add_col_header(slide, "Lesson Learned",
                   Inches(10.2), Inches(1.15), Inches(3.0), Inches(0.3), color=NAVY)

    s3 = """\
AI OPTIMIZES
FOR "WORKING
CODE" — NOT
SECURITY.

Every AI-generated
DevOps artifact
requires a
security-first
manual review.

Treat AI output
as a first draft,
not as
production-ready
code."""

    add_content_box(slide, s3,
                    Inches(10.2), Inches(1.5), Inches(3.0), Inches(5.85),
                    font_size=11, color=DGRAY)

    return slide


def build_slide8(prs):
    """Assertion: 320 Tests Across 3 Isolation Layers Form a CI Quality Gate"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "320 Tests Across 3 Isolation Layers Form a CI Quality Gate")

    col_w = Inches(4.2)
    gap = Inches(0.15)

    titles = [
        "Unit Tests — 196 Cases, 7 Files",
        "Frontend Tests — 124 Cases, 7 Files",
        "Integration & CI Enforcement",
    ]
    contents = [
        """\
FAST, ISOLATED — NO EXTERNAL DEPENDENCIES
Each lib module tested independently

auth.test.js
  JWT sign/verify, expiry, edge cases
validation.test.js
  All field constraints and enum values
rateLimit.test.js
  Window reset, IP extraction, per-IP limits
eventEmitter.test.js
  Domain event handlers, async flow
apiErrors.test.js
  Error class hierarchy, HTTP status codes
weatherService.test.js
  Cache hits, coordinate boundary cases
middleware.test.js
  Security headers, auth redirect logic""",

        """\
REACT TESTING LIBRARY + JSDOM — NO BROWSER
UI behavior verified against real component code

LoginPage.test.js
  Form submit, validation errors, OAuth button
MetricForm.test.js
  Field validation, edit mode, submit flow
Navbar.test.js
  Logout action, auth-aware link rendering
WeatherWidget.test.js
  Fetch lifecycle, loading state, error display
AuthProvider.test.js
  NextAuth session wrapper behavior
apiClient.test.js
  JWT injection, 401 auto-redirect handling
Spinner.test.js
  Loading UI component rendering""",

        """\
FULL HTTP CYCLE — REGISTER TO DELETE
Node --test runner against live server on :3001

api.test.js
  register → login
  → CRUD metrics (create/read/update/delete)
  → weather endpoint fetch
  → domain events table

CI PIPELINE ENFORCES THE QUALITY GATE
  Jest runs on every push to main branch
  Pipeline FAILS if any single test fails
  Coverage report artifact: 14-day retention

  Integration tests run locally only
  (require a live server on port 3001)
  Not run in CI — documented and runnable""",
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
    """Assertion: Observability Must Be Designed In — Not Bolted On"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg_color(slide, WHITE)
    add_slide_header(slide,
        "Observability Must Be Designed In — Not Bolted On")

    col_w = Inches(4.2)
    gap = Inches(0.15)

    titles = [
        "Evidence: What Was Built From Scratch",
        "Evidence: 4 Lessons That Transfer to Production",
        "Evidence: What Breaks at Scale — and the Fix",
    ]
    contents = [
        """\
ZERO-DEP PROMETHEUS — NO LIBRARY NEEDED
  lib/metrics.js: 170 lines, pure Node.js
  Correct Prometheus text-format 0.0.4 output
  Global singleton survives Next.js hot reloads
  Result: deeper understanding than using prom-client

MULTI-LAYER AUTH WITH SEAMLESS OAUTH BRIDGE
  JWT + NextAuth + /api/auth/token endpoint
  One getAuthUser() handles both token types
  OAuth users access every API endpoint without gaps

WEEK 7 QA FOUND BUGS UNIT TESTS MISSED
  sync(alter:true) silently wiped all seed data
    on every Next.js server restart
  Middleware secret mismatch caused auth redirect loop
    for all users — every session, every time
  Both found and fixed via end-to-end root-cause work""",

        """\
STRUCTURE LOGGING BEFORE YOU EVER NEED IT
  JSON logs are directly machine-parseable
  Sensitive-key sanitization prevents credential
  leakage in log files — built-in, not an afterthought

OBSERVABILITY CANNOT BE RETROFITTED
  Designing lib/logger.js and lib/metrics.js
  as shared modules made per-route instrumentation
  a 2-line change; retrofitting would touch 15+ files

AI IS A DRAFTING TOOL — NOT A SECURITY REVIEWER
  3 security flaws found in AI-generated CI YAML
  2 infrastructure bugs found only in live QA testing
  Security review of AI output is non-negotiable

END-TO-END QA SURFACES WHAT UNIT TESTS MISS
  All 320 unit/component tests passed throughout
  Runtime failures only emerged in live app usage""",

        """\
SCALE BOTTLENECKS — AND THE PRODUCTION FIX
  • SQLite → PostgreSQL + connection pooling
    (SQLite write-locks at concurrent writes)
  • In-memory rate limiter → Redis-backed
    (single-node state lost on pod restart)
  • Single instance → Kubernetes + HPA
    (auto-scale on cpu/request-rate metrics)

DEVELOPER EXPERIENCE GAPS TO CLOSE
  • OpenAPI/Swagger spec for all 15 API routes
  • Grafana alerts connected to PagerDuty / Slack

AI-ASSISTED CAMPUS FEATURES (FUTURE)
  • Natural language metric search
  • Anomaly detection on time-series data

"The CI/CD, observability, auth patterns,
 and AI audit discipline built here appear
 in every production system I will work on.
 This project gave me hands-on practice
 with the full DevOps lifecycle." """,
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

    print("Building slides (assertion-evidence format)...")
    build_slide1(prs)
    print("  [1/9] Title slide")
    build_slide2(prs)
    print("  [2/9] Assertion: Campus Analytics Eliminates University Metrics Data Silos")
    build_slide3(prs)
    print("  [3/9] Assertion: Next.js 15 Collapses Frontend and API Into One Deploy Unit")
    build_slide4(prs)
    print("  [4/9] Assertion: Technology Choices Minimize Overhead and Maximize Testability")
    build_slide5(prs)
    print("  [5/9] Assertion: Multi-Layer Defense Delivers 7 Production-Grade Campus Features")
    build_slide6(prs)
    print("  [6/9] Assertion: Every Commit Is Automatically Built, Tested, and Packaged")
    build_slide7(prs)
    print("  [7/9] Assertion: AI Code Had 3 Security Flaws — All Caught by Manual Review")
    build_slide8(prs)
    print("  [8/9] Assertion: 320 Tests Across 3 Isolation Layers Form a CI Quality Gate")
    build_slide9(prs)
    print("  [9/9] Assertion: Observability Must Be Designed In — Not Bolted On")

    prs.save(OUTPUT_PATH)
    size_bytes = os.path.getsize(OUTPUT_PATH)
    size_kb    = size_bytes / 1024
    print(f"\nPresentation saved successfully!")
    print(f"  Path : {OUTPUT_PATH}")
    print(f"  Size : {size_kb:.1f} KB ({size_bytes:,} bytes)")


if __name__ == "__main__":
    main()
