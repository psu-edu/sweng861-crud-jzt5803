"""
Campus Analytics Platform – SWENG 861 Presentation Generator
Generates a professional 9-slide PowerPoint presentation.
Run: python3 docs/create_presentation.py

Assertion-Evidence format (Michael Alley, Penn State):
  - Slide TITLE  = one complete-sentence assertion (the claim)
  - Slide BODY   = minimal evidence: diagram, table, or short key points
  - Speaker VOICE = carries the detail and explanation
  - Rule: slide must be readable in ~5 seconds
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml import parse_xml

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NAVY    = RGBColor(0x1e, 0x3a, 0x5f)
STEEL   = RGBColor(0x21, 0x96, 0xf3)
LBLUE   = RGBColor(0x90, 0xca, 0xf9)
WHITE   = RGBColor(0xff, 0xff, 0xff)
LGRAY   = RGBColor(0xf0, 0xf4, 0xf8)
DGRAY   = RGBColor(0x33, 0x33, 0x33)
MONO_BG = RGBColor(0xf5, 0xf5, 0xf5)
RED_LT  = RGBColor(0xff, 0xeb, 0xee)
RED_DK  = RGBColor(0xc6, 0x28, 0x28)
GRN_LT  = RGBColor(0xe8, 0xf5, 0xe9)
GRN_DK  = RGBColor(0x2e, 0x7d, 0x32)

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "campus-analytics-presentation.pptx"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def set_bg(slide, rgb):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def _cell_bg(cell, rgb):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    h = '{:02X}{:02X}{:02X}'.format(rgb[0], rgb[1], rgb[2])
    sf = parse_xml(
        f'<a:solidFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        f'<a:srgbClr val="{h}"/></a:solidFill>'
    )
    for e in tcPr.findall(qn("a:solidFill")):
        tcPr.remove(e)
    tcPr.insert(0, sf)


def rect(slide, l, t, w, h, fill, line=None):
    s = slide.shapes.add_shape(1, l, t, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line:
        s.line.color.rgb = line
    else:
        s.line.fill.background()
    return s


def textbox(slide, text, l, t, w, h,
            size=14, bold=False, color=DGRAY,
            align=PP_ALIGN.LEFT, italic=False,
            wrap=True, font="Calibri"):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font
    return tb


def multiline_box(slide, lines_data, l, t, w, h,
                  default_size=13, bg=None, mono=False):
    """
    lines_data: list of (text, size, bold, color, indent_level)
    Each tuple renders as one paragraph.
    """
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    if bg:
        tb.fill.solid()
        tb.fill.fore_color.rgb = bg
    else:
        tb.fill.background()

    for i, item in enumerate(lines_data):
        text = item[0]
        size = item[1] if len(item) > 1 else default_size
        bold = item[2] if len(item) > 2 else False
        color = item[3] if len(item) > 3 else DGRAY
        level = item[4] if len(item) > 4 else 0

        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = level
        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
        run.font.name = "Courier New" if mono else "Calibri"
    return tb


def slide_header(slide, assertion_text):
    """Navy bar + complete-sentence assertion as slide title."""
    rect(slide, Inches(0),    Inches(0),    SLIDE_W,       Inches(0.08), NAVY)
    rect(slide, Inches(0),    Inches(0.08), Inches(0.06),  Inches(1.0),  STEEL)
    rect(slide, Inches(0.06), Inches(0.08), Inches(13.27), Inches(1.0),  LGRAY)
    textbox(slide, assertion_text,
            Inches(0.28), Inches(0.12), Inches(12.8), Inches(0.92),
            size=22, bold=True, color=NAVY, align=PP_ALIGN.LEFT, wrap=False)
    rect(slide, Inches(0), Inches(7.42), SLIDE_W, Inches(0.08), NAVY)


def section_label(slide, text, l, t, w, h=Inches(0.32), color=NAVY):
    """Small bold column / section label."""
    textbox(slide, text, l, t, w, h, size=12, bold=True, color=color, wrap=False)


def divider(slide, x):
    """Vertical steel divider at position x."""
    rect(slide, x, Inches(1.1), Inches(0.04), Inches(6.3), STEEL)


def add_table(slide, headers, rows, l, t, w, h, col_widths=None):
    """Navy-header table."""
    nr = len(rows) + 1
    nc = len(headers)
    tbl = slide.shapes.add_table(nr, nc, l, t, w, h).table

    if col_widths:
        for i, cw in enumerate(col_widths[:nc]):
            tbl.columns[i].width = cw

    for ci, hdr in enumerate(headers):
        cell = tbl.cell(0, ci)
        cell.text = hdr
        _cell_bg(cell, NAVY)
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.runs[0]
        r.font.bold = True
        r.font.color.rgb = WHITE
        r.font.size = Pt(11)
        r.font.name = "Calibri"

    for ri, row in enumerate(rows):
        bg = LGRAY if ri % 2 == 0 else WHITE
        for ci, txt in enumerate(row):
            cell = tbl.cell(ri + 1, ci)
            cell.text = txt
            _cell_bg(cell, bg)
            p = cell.text_frame.paragraphs[0]
            r = p.runs[0]
            r.font.size = Pt(10)
            r.font.name = "Calibri"
            r.font.color.rgb = DGRAY
            if ci == 0:
                r.font.bold = True
                r.font.color.rgb = NAVY
    return tbl


# ---------------------------------------------------------------------------
# Slide 1 – Title (no assertion format needed)
# ---------------------------------------------------------------------------

def build_slide1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, NAVY)
    rect(slide, Inches(0), Inches(3.1), SLIDE_W, Inches(0.05), STEEL)

    textbox(slide, "Campus Analytics Platform",
            Inches(0.5), Inches(1.5), Inches(12.3), Inches(1.5),
            size=44, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    textbox(slide, "SWENG 861 – Software Construction  |  Spring 2026",
            Inches(0.5), Inches(3.2), Inches(12.3), Inches(0.8),
            size=22, bold=False, color=LBLUE, align=PP_ALIGN.CENTER)
    textbox(slide, "Jomar Thomas Almonte",
            Inches(0.5), Inches(4.15), Inches(12.3), Inches(0.65),
            size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    textbox(slide, "Pennsylvania State University",
            Inches(0.5), Inches(4.85), Inches(12.3), Inches(0.55),
            size=15, color=LBLUE, align=PP_ALIGN.CENTER)
    return slide


# ---------------------------------------------------------------------------
# Slide 2 – Requirements
# Assertion: Campus Analytics Eliminates University Metrics Data Silos
# Evidence: The 3 failures  vs  7 delivered features
# ---------------------------------------------------------------------------

def build_slide2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Campus Analytics Eliminates University Metrics Data Silos")

    # ── LEFT: The Problem (3 items) ────────────────────────────────────────
    section_label(slide, "THE PROBLEM", Inches(0.3), Inches(1.15), Inches(5.9))

    problem = [
        ("✗  No audit trail", 20, False, RED_DK),
        ("", 14),
        ("✗  No access control", 20, False, RED_DK),
        ("", 14),
        ("✗  No single source of truth", 20, False, RED_DK),
    ]
    multiline_box(slide, problem, Inches(0.3), Inches(1.55), Inches(5.9), Inches(5.5))

    divider(slide, Inches(6.35))

    # ── RIGHT: The Solution (7 items) ─────────────────────────────────────
    section_label(slide, "THE SOLUTION", Inches(6.55), Inches(1.15), Inches(6.5))

    solution = [
        ("✓  Secure auth (JWT + OAuth)", 18, False, GRN_DK),
        ("", 8),
        ("✓  5-category metrics CRUD", 18, False, GRN_DK),
        ("", 8),
        ("✓  Weather widget (°F / mph)", 18, False, GRN_DK),
        ("", 8),
        ("✓  Domain event audit trail", 18, False, GRN_DK),
        ("", 8),
        ("✓  Prometheus + Grafana", 18, False, GRN_DK),
        ("", 8),
        ("✓  GitHub Actions CI/CD", 18, False, GRN_DK),
        ("", 8),
        ("✓  Non-root Docker image", 18, False, GRN_DK),
    ]
    multiline_box(slide, solution, Inches(6.55), Inches(1.55), Inches(6.5), Inches(5.5))
    return slide


# ---------------------------------------------------------------------------
# Slide 3 – Architecture
# Assertion: Next.js 15 Collapses Frontend and API Into One Deploy Unit
# Evidence: Architecture diagram (the diagram IS the proof)
# ---------------------------------------------------------------------------

def build_slide3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Next.js 15 Collapses Frontend and API Into One Deploy Unit")

    # ── LEFT: 4-line rationale ─────────────────────────────────────────────
    left = [
        ("One codebase. One image. No split deploy.", 16, True, NAVY),
        ("", 14),
        ("Frontend:  Next.js 15 · React 19 · TailwindCSS 4", 15, False, DGRAY),
        ("", 10),
        ("API:  15 routes · JWT auth · rate limiting", 15, False, DGRAY),
        ("", 10),
        ("Data:  SQLite · Sequelize · 4 models", 15, False, DGRAY),
    ]
    multiline_box(slide, left, Inches(0.3), Inches(1.2), Inches(5.5), Inches(6.1))

    # ── RIGHT: architecture diagram (PNG) ────────────────────────────────
    arch_png = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "diagrams", "architecture.png")
    slide.shapes.add_picture(arch_png, Inches(5.8), Inches(1.2),
                             Inches(7.2), Inches(6.1))
    return slide


# ---------------------------------------------------------------------------
# Slide 4 – Tech Stack
# Assertion: Every Technology Choice Minimizes Overhead and Maximizes Testability
# Evidence: The choice table — each row shows the "why", not just the "what"
# ---------------------------------------------------------------------------

def build_slide4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Every Technology Choice Minimizes Overhead and Maximizes Testability")

    headers = ["Layer", "Technology", "Why"]
    rows = [
        ["Frontend",      "Next.js 15",              "UI + API in one deploy"],
        ["UI",            "React 19 + TailwindCSS 4", "Zero custom CSS"],
        ["Auth",          "NextAuth 4 + JWT",          "One check · two token types"],
        ["Database",      "SQLite + Sequelize 6",      "Zero infrastructure needed"],
        ["3rd Party",     "Open-Meteo API",            "Free · keyless · no secrets"],
        ["Testing",       "Jest 30 + RTL",             "320 tests block broken builds"],
        ["Containers",    "Docker (3-stage)",          "Non-root · minimal image"],
        ["CI/CD",         "GitHub Actions",            "Auto build → test → package"],
        ["Observability", "Prometheus + Grafana",      "SLO dashboards · no cloud deps"],
    ]

    add_table(slide, headers, rows,
              Inches(0.25), Inches(1.2), Inches(12.83), Inches(6.05),
              col_widths=[Inches(1.35), Inches(2.3), Inches(9.18)])
    return slide


# ---------------------------------------------------------------------------
# Slide 5 – Core Features
# Assertion: Multi-Layer Defense and Seven Features Deliver Production-Grade Security
# Evidence: Two concise columns — auth/security left, data features right
# ---------------------------------------------------------------------------

def build_slide5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Multi-Layer Defense and Seven Features Deliver Production-Grade Security")

    # ── LEFT: Auth & Security (3 items) ───────────────────────────────────
    section_label(slide, "AUTH & SECURITY", Inches(0.3), Inches(1.15), Inches(6.0))

    left = [
        ("JWT + NextAuth + OAuth → one getAuthUser()", 17, False, DGRAY),
        ("", 16),
        ("bcrypt cost 12 · rate limit 5 req/15min/IP", 17, False, DGRAY),
        ("", 16),
        ("HSTS · BOLA checks · keys stripped from logs", 17, False, DGRAY),
    ]
    multiline_box(slide, left, Inches(0.3), Inches(1.55), Inches(6.0), Inches(5.5))

    divider(slide, Inches(6.45))

    # ── RIGHT: Data Features (4 items) ────────────────────────────────────
    section_label(slide, "DATA FEATURES", Inches(6.65), Inches(1.15), Inches(6.4))

    right = [
        ("5 categories · UUID keys · admin sees all", 17, False, DGRAY),
        ("", 14),
        ("US format: 47,892 students · $2.1B USD", 17, False, DGRAY),
        ("", 14),
        ("Weather: cached 10 min · °F · mph", 17, False, DGRAY),
        ("", 14),
        ("Audit trail: async · append-only", 17, False, DGRAY),
    ]
    multiline_box(slide, right, Inches(6.65), Inches(1.55), Inches(6.4), Inches(5.5))
    return slide


# ---------------------------------------------------------------------------
# Slide 6 – DevOps
# Assertion: Every Commit Is Automatically Built, Tested, and Packaged — No Manual Steps
# Evidence: Pipeline flow (left) + observability summary (right)
# ---------------------------------------------------------------------------

def build_slide6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Every Commit Is Automatically Built, Tested, and Packaged — No Manual Steps")

    # ── LEFT: pipeline diagram (PNG) ───────────────────────────────────────
    section_label(slide, "CI/CD Pipeline  (triggers on every push / PR to main)",
                  Inches(0.3), Inches(1.15), Inches(6.1))

    pipeline_png = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "diagrams", "pipeline.png")
    slide.shapes.add_picture(pipeline_png, Inches(0.3), Inches(1.52),
                             Inches(6.1), Inches(5.8))

    divider(slide, Inches(6.55))

    # ── RIGHT: observability ───────────────────────────────────────────────
    section_label(slide, "Observability Stack", Inches(6.75), Inches(1.15), Inches(6.3))

    right = [
        ("/health · /live · /ready — one role each", 16, False, DGRAY),
        ("", 18),
        ("JSON logs · sensitive keys auto-stripped", 16, False, DGRAY),
        ("", 18),
        ("4 Prometheus metrics → 5-panel Grafana", 16, False, DGRAY),
        ("SLOs: ≥99.5% avail · p95 ≤ 500ms", 16, True, NAVY),
    ]
    multiline_box(slide, right, Inches(6.75), Inches(1.55), Inches(6.3), Inches(5.5))
    return slide


# ---------------------------------------------------------------------------
# Slide 7 – AI Audit
# Assertion: AI-Generated Code Contained 3 Security Flaws — All Caught by Manual Review
# Evidence: Flaw table (the audit results) + challenge list
# ---------------------------------------------------------------------------

def build_slide7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "AI-Generated Code Contained 3 Security Flaws — All Caught by Manual Review")

    # ── TOP: AI flaw table (the primary evidence) ──────────────────────────
    section_label(slide, "Evidence: AI Audit Findings (CI/CD YAML + Dockerfile)",
                  Inches(0.3), Inches(1.15), Inches(9.0))

    headers = ["Flaw", "Risk", "Fix"]
    rows = [
        ["Hard-coded JWT_SECRET in YAML",
         "Credentials in git history",
         "${{ secrets.JWT_SECRET }}"],
        ["continue-on-error: true on tests",
         "Broken builds pass CI",
         "Flag removed"],
        ["No USER in Dockerfile",
         "Container runs as root",
         "USER nextjs (UID 1001)"],
    ]
    add_table(slide, headers, rows,
              Inches(0.3), Inches(1.52), Inches(12.73), Inches(3.0),
              col_widths=[Inches(3.8), Inches(4.23), Inches(4.7)])

    # ── BOTTOM: 5 challenges ───────────────────────────────────────────────
    section_label(slide, "Also resolved:", Inches(0.3), Inches(4.65), Inches(9.0))

    challenges = [
        ("ESM/CJS interop → Next.js webpack layer", 12, False, DGRAY),
        ("Prometheus singleton → global.__campusMetrics", 12, False, DGRAY),
        ("sync(alter:true) wiped data → sync()", 12, False, DGRAY),
        ("Middleware secret mismatch → auth loop → aligned fallbacks", 12, False, DGRAY),
        ("OAuth users got 401 → /api/auth/token bridge", 12, False, DGRAY),
    ]
    multiline_box(slide, challenges, Inches(0.3), Inches(5.0), Inches(12.73), Inches(2.3))
    return slide


# ---------------------------------------------------------------------------
# Slide 8 – Testing
# Assertion: 320 Tests Across Three Isolation Layers Form a CI Quality Gate
# Evidence: Three-column breakdown + quality gate rule
# ---------------------------------------------------------------------------

def build_slide8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "320 Tests Across Three Isolation Layers Form a CI Quality Gate")

    headers = ["UNIT — 196 cases", "FRONTEND — 124 cases", "INTEGRATION + CI"]
    rows = [
        ["auth · validation",               "LoginPage · MetricForm",           "api.test.js"],
        ["rateLimit · events",              "Navbar · WeatherWidget",           "register → login → CRUD"],
        ["apiErrors · weather · middleware", "AuthProvider · apiClient · Spinner", "Node --test · server :3001"],
        ["Fast · isolated · no deps",       "React Testing Library · jsdom",    "Pipeline FAILS if any test fails"],
    ]
    add_table(slide, headers, rows,
              Inches(0.25), Inches(1.3), Inches(12.83), Inches(5.9),
              col_widths=[Inches(4.28), Inches(4.28), Inches(4.27)])
    return slide


# ---------------------------------------------------------------------------
# Slide 9 – Reflections
# Assertion: Observability Must Be Designed In — Not Bolted On
# Evidence: Three columns — what was built, lessons, what breaks at scale
# ---------------------------------------------------------------------------

def build_slide9(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, WHITE)
    slide_header(slide,
        "Observability Must Be Designed In — Not Bolted On")

    col_w = Inches(4.15)
    gap   = Inches(0.13)

    titles = ["BUILT FROM SCRATCH", "LESSONS", "WHAT BREAKS AT SCALE"]
    columns = [
        [
            ("Zero-dep Prometheus (170 lines)", 15, False, DGRAY),
            ("", 14),
            ("JWT + NextAuth + OAuth bridge", 15, False, DGRAY),
            ("", 14),
            ("Week 7: 2 infra bugs found via QA", 15, False, DGRAY),
        ],
        [
            ("Log JSON before you need it", 15, False, DGRAY),
            ("", 14),
            ("AI drafts · humans review security", 15, False, DGRAY),
            ("", 14),
            ("E2E finds what unit tests miss", 15, False, DGRAY),
        ],
        [
            ("SQLite → PostgreSQL", 15, False, DGRAY),
            ("", 14),
            ("In-memory limiter → Redis", 15, False, DGRAY),
            ("", 14),
            ("Single instance → Kubernetes", 15, False, DGRAY),
        ],
    ]

    for i, (title, col_data) in enumerate(zip(titles, columns)):
        left = Inches(0.2) + i * (col_w + gap)
        section_label(slide, title, left, Inches(1.15), col_w)
        multiline_box(slide, col_data, left, Inches(1.55), col_w, Inches(4.6))
        if i < 2:
            rect(slide, left + col_w + Inches(0.05),
                 Inches(1.1), Inches(0.04), Inches(5.0), STEEL)

    # Quote at bottom
    textbox(slide,
            "\u201cThese patterns appear in every production system I will work on.\u201d",
            Inches(0.5), Inches(6.1), Inches(12.33), Inches(1.2),
            size=17, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    return slide


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H

    print("Building slides (assertion-evidence format)...")
    build_slide1(prs);  print("  [1/9] Title")
    build_slide2(prs);  print("  [2/9] Campus Analytics Eliminates University Metrics Data Silos")
    build_slide3(prs);  print("  [3/9] Next.js 15 Collapses Frontend and API Into One Deploy Unit")
    build_slide4(prs);  print("  [4/9] Every Technology Choice Minimizes Overhead and Maximizes Testability")
    build_slide5(prs);  print("  [5/9] Multi-Layer Defense and Seven Features Deliver Production-Grade Security")
    build_slide6(prs);  print("  [6/9] Every Commit Is Automatically Built, Tested, and Packaged")
    build_slide7(prs);  print("  [7/9] AI-Generated Code Contained 3 Security Flaws — All Caught by Manual Review")
    build_slide8(prs);  print("  [8/9] 320 Tests Across Three Isolation Layers Form a CI Quality Gate")
    build_slide9(prs);  print("  [9/9] Observability Must Be Designed In — Not Bolted On")

    prs.save(OUTPUT_PATH)
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"\nSaved: {OUTPUT_PATH}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
