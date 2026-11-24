#!/usr/bin/env python3
"""Assemble a static, offline preview of the finished WordPress site.

Renders the same markup the PHP templates emit, against the same style.css,
so the preview is an accurate proof of the design before anything is built in
WordPress.
"""
import os, re, html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT  = ROOT / "preview"

NAV = [("Home","index.html"),("About Me","about-me.html"),("Resume","resume.html"),
       ("Gallery","gallery.html"),("Blog","blog.html"),("Excel Helper","excel-helper.html")]

def sync():
    """Copy theme assets into preview/assets so the two can never drift apart."""
    import shutil
    t, d = ROOT / "theme" / "roman-heuser", OUT / "assets"
    (d / "vendor").mkdir(parents=True, exist_ok=True)
    for src, dst in [("style.css", "style.css"), ("assets/css/cinematic.css", "cinematic.css"), ("assets/css/drive.css", "drive.css"),
                     ("assets/js/theme.js", "theme.js"), ("assets/js/cinematic.js", "cinematic.js"), ("assets/js/drive.js", "drive.js"),
                     ("assets/js/drive-world.js", "drive-world.js"), ("assets/img/site-icon.png", "site-icon.png"), ("assets/js/vendor/three.rh.min.js", "vendor/three.rh.min.js")] + [
                     (f"assets/img/{n}.webp", f"{n}.webp") for n in ("plate-vegas", "plate-reno", "plate-vegas-sm", "plate-reno-sm")]:
        if not (d / dst).exists() or (t / src).read_bytes() != (d / dst).read_bytes():
            shutil.copy(t / src, d / dst)
sync()

def sync_resumes():
    """Hosts serve preview/ as the site root, so the PDFs must live inside it."""
    import shutil
    (OUT / "resume").mkdir(parents=True, exist_ok=True)
    for pdf in (ROOT / "resume").glob("*.pdf"):
        shutil.copy(pdf, OUT / "resume" / pdf.name)
sync_resumes()

def A(name):
    """Asset URL with a content-time stamp, so a browser never serves a stale copy
    of CSS/JS after a rebuild (heuristic caching can hold files for days)."""
    f = ROOT / "preview" / "assets" / name
    return f"assets/{name}?v={int(f.stat().st_mtime)}" if f.exists() else f"assets/{name}"

GFONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400'
          '&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">')

def nav(cur):
    items = []
    for label, href in NAV:
        cls = ' class="current-menu-item"' if href == cur else ""
        items.append(f'<li{cls}><a href="{href}">{html.escape(label)}</a></li>')
    return "\n".join(items)

RANGE = {"about-me.html":"1,7.3","resume.html":"2.9,4.3","gallery.html":"5,7.2","blog.html":"3.9,5.2","excel-helper.html":"0.9,2.1"}

def chrome(title, cur, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>@media (prefers-reduced-motion:no-preference){{@view-transition{{navigation:auto}}}}</style>
<script>addEventListener('pagereveal',function(e){{window.RHVT=e.viewTransition?e.viewTransition.finished:null}})</script>
<title>{html.escape(title)} — Roman Heuser</title>
{GFONTS}
<link rel="stylesheet" href="{A('style.css')}">
<link rel="stylesheet" href="{A('cinematic.css')}">
<link rel="stylesheet" href="{A('drive.css')}">
<link rel="icon" href="assets/site-icon.png" sizes="512x512">
</head>
<body class="no-js rd-on{' rd-home' if cur == 'index.html' else ''}" data-rd-range="{RANGE.get(cur, '1,4')}" data-rd-img="assets/">
<a class="skip-link screen-reader-text" href="#rh-main">Skip to content</a>

<header class="rh-header" id="rh-header">
  <div class="rh-edge rh-header__inner">
    <a class="rh-brand" href="index.html" rel="home">
      <img src="assets/logo.png" alt="Roman Heuser" class="custom-logo rh-brand__light" width="2400" height="600">
      <img src="assets/logo-header-light.png" alt="Roman Heuser" class="custom-logo rh-brand__dark" width="2400" height="600">
    </a>
    <button class="rh-burger" id="rh-burger" aria-expanded="false" aria-controls="rh-nav" aria-label="Toggle menu"><span></span></button>
    <nav class="rh-nav" id="rh-nav" aria-label="Primary">
      <ul id="rh-primary-menu">
{nav(cur)}
      </ul>
    </nav>
  </div>
</header>
<div class="rh-scrim" id="rh-scrim" hidden></div>

<main id="rh-main">
{body}
</main>

<footer class="rh-footer">
  <div class="rh-edge">
    <div class="rh-footer__grid">
      <div>
        <img src="assets/logo-light.png" alt="Roman Heuser" class="rh-footer__logo">
        <p>Built from scratch on a self-hosted WordPress install — custom theme, no page builder. Thanks for stopping by.</p>
      </div>
      <div>
        <h2 class="widget-title">Explore</h2>
        <ul>{"".join(f'<li><a href="{h}">{html.escape(l)}</a></li>' for l,h in NAV)}</ul>
      </div>
      <div>
        <h2 class="widget-title">Get in touch</h2>
        <ul>
          <li><a href="mailto:heuser@romanattitudeofgratitude.com">heuser@romanattitudeofgratitude.com</a></li>
          <li>Reno, Nevada</li>
          <li>University of Nevada, Reno</li>
        </ul>
      </div>
    </div>
    <div class="rh-footer__bar">
      <span>&copy; 2026 Roman Heuser. All rights reserved.</span>
      <span>Self-hosted WordPress · Custom &ldquo;Heuser&rdquo; theme, hand-built</span>
    </div>
  </div>
</footer>
<script src="{A('theme.js')}"></script>
<script src="{A('cinematic.js')}"></script>
<script src="{A('vendor/three.rh.min.js')}"></script>
<script src="{A('drive-world.js')}"></script>
<script src="{A('drive.js')}"></script>
<script src="{A('blog-demo.js')}"></script>
</body>
</html>
"""

def pagehead(eyebrow, title, sub=""):
    subhtml = f"<p>{sub}</p>" if sub else ""
    return f"""<header class="rh-pagehead rh-pagehead--art" style="--rh-pagehead-art:url('assets/mesh.jpg')">
  <div class="rh-edge" style="position:relative;z-index:1">
    <p class="rh-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {subhtml}
  </div>
</header>"""

def read(p):
    s = (ROOT / "content" / p).read_text()
    return re.sub(r"<!--.*?-->", "", s, flags=re.S).strip()

# ---------------- HOME ----------------
VENTURES = [
    ("Founder","GoMojo","A free AI concierge for Las Vegas. Give it a vibe and a budget, and six seconds later you have a real three-stop night, with venues, times and costs, planned by a seven-agent swarm.",
     ["7-agent AI swarm","Installable PWA","Built for under $1K"]),
    ("Co-founder","LifeSwitch","A private vault for everything you own, and who it goes to. Photograph it, seal it, and name the person it is for.",
     ["45 kinds of record","Two of three keys","Next.js + MongoDB"]),
    ("Builder","GoInvest","A research sandbox where eight AI investor personas debate a stock, vote, and log every argument. Paper-traded and labeled educational, on purpose.",
     ["8 investor personas","Every debate logged","Paper trading only"]),
]
DEST = [
    ("Chapter 01","About Me","about-me.html","Where I grew up, why I picked business, the four jobs that taught me more than any of it, and where this is going."),
    ("Chapter 02","Resume","resume.html","Two versions of the same resume — my original, and one I retooled for a product role using AI as an editor, not an author. The prompts are documented."),
    ("Chapter 03","Gallery","gallery.html","A Reno sunset, a treenet in the pines, and Dye is Life at the SAE house. All my own photographs."),
    ("Chapter 04","Blog","blog.html","One long look at a scam I watched work in real life, how it was built, and the questions that would have stopped it."),
]
STATS = [("3","Products shipped"),("&lt;<span>$1K</span>","Total build cost, GoMojo"),("15","AI agents in production"),("6<span>s</span>","To plan a night out")]

vcards = "\n".join(f"""<article class="rh-card rh-card--hover rh-reveal rh-glass rh-tilt"><span class="rh-tilt__sheen" aria-hidden="true"></span>
  <p class="rh-card__kicker">{role}</p><h3>{name}</h3><p>{blurb}</p>
  <ul class="rh-chips">{"".join(f"<li>{f}</li>" for f in facts)}</ul>
</article>""" for role,name,blurb,facts in VENTURES)

dcards = "\n".join(f"""<a class="rh-card rh-reveal rh-glass rh-tilt" href="{href}"><span class="rh-tilt__sheen" aria-hidden="true"></span>
  <p class="rh-card__kicker">{k}</p><h3>{t}</h3><p>{c}</p>
  <span class="rh-card__foot">Open <span class="rh-btn__arrow" aria-hidden="true">&rarr;</span></span>
</a>""" for k,t,href,c in DEST)

scards = "\n".join(f'<div class="rh-stat"><div class="rh-stat__num">{n}</div><div class="rh-stat__label">{l}</div></div>' for n,l in STATS)

# On by default in the theme (Customizer > Opening Sequence), so the preview plays it too.
INTRO = (ROOT / "content" / "_intro-markup.html").read_text().replace("__LOGO__", "assets/logo-light.png")

PHOTOS = [  # file, label, alt, object-position on square crops, w, h
  ("reno-sunset.jpg", "Reno, after dark", "Casino entrance chandeliers framing a pink and violet sunset over the mountains and the Reno skyline", "50% 82%", 2000, 1500),
  ("treenet.jpg",     "Treenet",          "Looking up through a woven rope treenet at someone climbing into it between pine trees", "50% 35%", 1500, 2000),
  ("dye-is-life.jpg", "Dye is Life",      "A crowded backyard party at the Sigma Alpha Epsilon house, with people watching from the roof", "50% 40%", 2000, 1500),
]
life = "\n".join(
    f'<a class="rh-life__tile" href="gallery.html"><img src="assets/gallery/{f}" alt="{html.escape(alt)}" '
    f'width="{w}" height="{h}" loading="lazy" style="object-position:{pos}"><span>{label}</span></a>'
    for f, label, alt, pos, w, h in PHOTOS)

# The Drive: same file the theme reads (theme/roman-heuser/parts/drive.html).
drive = (ROOT / "theme" / "roman-heuser" / "parts" / "drive.html").read_text()
for k, v in {
    "eyebrow": "Reno, Nevada · From Las Vegas", "title": "I build things that <em>ship</em>.",
    "sub": "Co-founder of LifeSwitch. Founder of GoMojo and GoInvest. Business freshman at the University of Nevada, Reno — I turn ideas into working software, usually faster and for less money than anyone expects.",
    "cta1_txt": "Read my story", "cta1_url": "about-me.html", "cta2_txt": "View my resume", "cta2_url": "resume.html",
    "logo": "assets/logo-light.png"}.items():
    drive = drive.replace("{{" + k + "}}", v)
drive = re.sub(r"\{\{img:([^}]+)\}\}", lambda m: "assets/" + m.group(1).replace("life/", "gallery/"), drive)
drive = re.sub(r"\{\{url:([^}]+)\}\}", lambda m: dict(NAV)[m.group(1)], drive)
assert "{{" not in drive, "unfilled token in parts/drive.html"
home = INTRO + drive

# ---------------- INTERIOR PAGES ----------------
def article(body):
    return f'<section class="rh-section"><div class="rh-edge"><div class="rh-article">{body}</div></div></section>'

about_body = read("about-me.html").replace("((MEDIA URL: ", "assets/gallery/").replace(".jpg))", ".jpg")
# On the real site these are permalinks; here they are files.
for _l, _h in NAV:
    about_body = about_body.replace(f'href="/{_h.replace(".html", "")}/"', f'href="{_h}"')
about = pagehead("Roman Heuser","About Me","Founder, student, and the person who answers the support email.") + article(about_body)

resume_body = read("resume.html")
resume_body = resume_body.replace('[pdf-embedder url="((MEDIA URL: resume-original.pdf))" title="Roman Heuser Resume — Original"]',
    '<iframe class="rh-pdf" src="resume/resume-original.pdf#toolbar=0&navpanes=0&view=FitH" title="Resume — Original"></iframe>')
resume_body = resume_body.replace('[pdf-embedder url="((MEDIA URL: resume-ai-refined.pdf))" title="Roman Heuser Resume — Product Manager version"]',
    '<iframe class="rh-pdf" src="resume/resume-ai-refined.pdf#toolbar=0&navpanes=0&view=FitH" title="Resume — Product"></iframe>')
resume_body = resume_body.replace("((MEDIA URL: resume-original.pdf))","resume/resume-original.pdf")
resume_body = resume_body.replace("((MEDIA URL: resume-ai-refined.pdf))","resume/resume-ai-refined.pdf")
resume = pagehead("Roman Heuser","Resume","Two versions of the same experience, and the prompts that produced the second.") + article(resume_body)

def gal_item(i, f, label, alt, pos, w, h):
    tall = " rh-gallery__item--tall" if h > w else ""
    return (f'<figure class="rh-gallery__item{tall}"><a href="assets/gallery/{f}">'
            f'<img src="assets/gallery/{f}" alt="{html.escape(alt)}" width="{w}" height="{h}" loading="lazy" style="--rh-focus:{pos}"></a>'
            f'<figcaption><b>{i:02d}</b>{label}</figcaption></figure>')

# Caption order. CSS pins the tall (portrait) frame to the left column.
mosaic = '<div class="rh-gallery">' + "".join(
    gal_item(i + 1, *PHOTOS[i]) for i in range(len(PHOTOS))) + "</div>"
gal_body = read("gallery.html").replace("((GALLERY SHORTCODE GOES HERE))", mosaic)
gallery = pagehead("Roman Heuser","Gallery","Reno, the pines, and the SAE house. All my own photographs.") + article(gal_body)

post = read("blog-post.html")
blog = pagehead("Blog", "The Restaurant With 400 Perfect Reviews and No Customers",
                "Published August 2026 &middot; about 6 minutes to read") + f"""
<section class="rh-section"><div class="rh-edge"><div class="rh-article">
{post}
<div id="rh-blog-demo"></div>
</div></div></section>"""

excel_widget = (ROOT / "chatbot" / "excel-gpt-chatbot.html").read_text()
excel_widget = re.sub(r"<!--.*?-->", "", excel_widget, flags=re.S).strip()
excel = pagehead("Excel Helper","Ask my Excel GPT","A Custom GPT trained on Microsoft Excel — ask it about formulas, PivotTables, charts, or the error you are stuck on.") + \
    f'<section class="rh-section"><div class="rh-edge">{excel_widget}</div></section>'
# The plugin version (chatbot-b.html) is a builder's page: open it by address, it is
# not linked from anything a visitor sees. See chatbot/CHOOSING.md.

# ---------------- CHATBOT B (the plugin) ----------------
_php = (ROOT / "chatbot" / "rh-excel-gpt" / "rh-excel-gpt.php").read_text()
_m = re.search(r'<div class="rhxg" id="rhxg-root".*?</div>\s*\n\t<\?php', _php, re.S)
_w = _m.group(0).replace("\n\t<?php", "")
_w = re.sub(r"<\?php echo esc_attr\(.*?\); \?>", "1", _w)
_w = re.sub(r"<\?php esc_attr_e\(\s*'(.*?)',.*?\); \?>", r"\1", _w)
_w = re.sub(r"<\?php esc_html_e\(\s*'(.*?)',.*?\); \?>", r"\1", _w)
_w = re.sub(r"<\?php if \( \$o\['gpt_url'\] \) : \?>.*?<\?php endif; \?>",
            '', _w, flags=re.S)   # no link until a real GPT address exists

botb = pagehead("Chatbot B", "Excel GPT Assistant",
                "A WordPress plugin. Floating launcher, live model, API key kept server-side.") + """
<section class="rh-section"><div class="rh-edge"><div class="rh-article">
  <p class="rh-lede">Click the green <strong>Ask about Excel</strong> button in the bottom-right corner.</p>
  <p>This is the plugin's real interface and its real JavaScript, talking to a real chat endpoint on
  this dev server. Ask it something — VLOOKUP, PivotTables, IF, SUMIF, <code>#N/A</code>, absolute
  references, shortcuts, duplicates, charts — and it answers. Ask it something that is not about
  Excel and it will refuse, because the system prompt tells it to.</p>
  <p><strong>Offline vs live.</strong> With no API key set, the dev server answers from a small
  built-in set so the whole flow is testable. Set <code>OPENAI_API_KEY</code> (or
  <code>ANTHROPIC_API_KEY</code>) before starting the server and the exact same interface returns
  real model answers instead:</p>
  <pre style="background:var(--rh-bg-alt);padding:1rem;border-radius:var(--rh-radius-sm);overflow-x:auto"><code>OPENAI_API_KEY=sk-... python3 build/devserver.py</code></pre>
  <p>On the real site this endpoint is <code>/wp-json/rh-excel-gpt/v1/chat</code>, served by the
  plugin, with your key in the WordPress database and never in the page.</p>
  <p><a href="excel-helper.html">Compare it with the inline version &rarr;</a></p>
</div></div></section>
""" + _w + """
<script>
var RHXG = { endpoint:'/wp-json/rh-excel-gpt/v1/chat', nonce:'dev', live:1,
  greeting:'Hi — I am an Excel assistant. Ask me about formulas, PivotTables, charts, or the error message you are stuck on.',
  gptUrl:'' };
</script>
<link rel="stylesheet" href="assets/rhxg.css">
<script src="assets/rhxg.js"></script>
"""

PAGES = {
 "index.html": ("Home", home),
 "about-me.html": ("About Me", about),
 "resume.html": ("Resume", resume),
 "gallery.html": ("Gallery", gallery),
 "blog.html": ("Blog", blog),
 "excel-helper.html": ("Excel Helper", excel),
 "chatbot-b.html": ("Chatbot B", botb),
}
OUT.mkdir(exist_ok=True)
for fn,(title,body) in PAGES.items():
    (OUT/fn).write_text(chrome(title, fn, body))
    print("wrote preview/"+fn)
