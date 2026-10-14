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
       ("Gallery","gallery.html"),("Blog","blog.html"),("Chatbot A","excel-helper.html"),("Chatbot B","chatbot-b.html")]

GFONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400'
          '&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">')

def nav(cur):
    items = []
    for label, href in NAV:
        cls = ' class="current-menu-item"' if href == cur else ""
        items.append(f'<li{cls}><a href="{href}">{html.escape(label)}</a></li>')
    return "\n".join(items)

def chrome(title, cur, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} — Roman Heuser</title>
{GFONTS}
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/cinematic.css">
<link rel="icon" href="assets/logo.png">
</head>
<body class="no-js">
<a class="skip-link screen-reader-text" href="#rh-main">Skip to content</a>

<header class="rh-header" id="rh-header">
  <div class="rh-edge rh-header__inner">
    <a class="rh-brand" href="index.html" rel="home">
      <img src="assets/logo.png" alt="Roman Heuser" class="custom-logo">
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
        <ul class="rh-social">
          <li><a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8h4.52v14H.24V8zm7.4 0h4.33v1.92h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.93V22h-4.52v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V22H7.64V8z"/></svg></a></li>
          <li><a href="#" aria-label="GitHub"><svg viewBox="0 0 24 24"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z"/></svg></a></li>
          <li><a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 01-1.38-.9 3.8 3.8 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 00-2.13 1.39A5.9 5.9 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.13a5.9 5.9 0 002.13 1.39c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 002.13-1.39 5.9 5.9 0 001.39-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 00-1.39-2.13A5.9 5.9 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32A6.16 6.16 0 0012 5.84zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg></a></li>
        </ul>
      </div>
      <div>
        <h2 class="widget-title">Explore</h2>
        <ul>{"".join(f'<li><a href="{h}">{html.escape(l)}</a></li>' for l,h in NAV)}</ul>
      </div>
      <div>
        <h2 class="widget-title">Get in touch</h2>
        <ul>
          <li><a href="mailto:heuser@romanattitudeofgratitude.com">heuser@romanattitudeofgratitude.com</a></li>
          <li>Las Vegas, Nevada</li>
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
<script src="assets/theme.js"></script>
<script src="assets/cinematic.js"></script>
<script src="assets/blog-demo.js"></script>
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
    ("Founder","GoMojo","A free AI concierge for Las Vegas. You give it a vibe and a budget; six seconds later you have a real three-stop night with real venues, real times and real costs. Behind the answer is a seven-agent swarm that argues about budget, distance, timing and taste before it commits.",
     ["7-agent AI swarm","Installable PWA","Free tier, no ads","Reno + Sparks next"]),
    ("Frontend Design Lead","TagData","A personal-data vault I was hired to redesign, with full authority over the frontend. The TagData ID turns any slice of your vault into a styled, scannable card — and the shared data lives inside the link itself, never on a server.",
     ["$3.5M invested","Full frontend authority","Token-driven design system","Next.js + .NET"]),
    ("Builder","GoInvest","A multi-agent research sandbox where eight investor personas — momentum, quant, macro, value, biotech, forensic short — debate a ticker, vote, and log every argument and outcome to a database. Educational only, and deliberately paper-traded.",
     ["8 investor personas","Every debate logged","Paper trading only","Not investment advice"]),
]
DEST = [
    ("Chapter 01","About Me","about-me.html","Where I grew up, why I picked business, the four jobs that taught me more than any of it, and where this is going."),
    ("Chapter 02","Resume","resume.html","Two versions of the same resume — my original, and one I retooled for a product role using AI as an editor, not an author. The prompts are documented."),
    ("Chapter 03","Gallery","gallery.html","Photographs from the places, people and late nights behind the work. All my own images."),
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

INTRO = (ROOT / "content" / "_intro-markup.html").read_text().replace("__LOGO__", "assets/logo-light.png")

home = INTRO + f"""<section class="rh-hero">
  <canvas class="rh-fx rh-fx--interactive" id="rh-galaxy" role="img" aria-label="Interactive particle galaxy. Drag to rotate."></canvas>
  <img class="rh-hero__bg" src="assets/vegas-night.jpg" alt="" aria-hidden="true">
  <div class="rh-edge">
    <p class="rh-hero__eyebrow">Las Vegas · University of Nevada, Reno</p>
    <img class="rh-hero__logo" src="assets/logo-light.png" alt="Roman Heuser">
    <h1>I build things that <em>ship</em>.</h1>
    <p class="rh-hero__sub">Founder of GoMojo and GoInvest. Frontend design lead at TagData. Business freshman at the University of Nevada, Reno — I turn ideas into working software, usually faster and for less money than anyone expects.</p>
    <div class="rh-hero__cta">
      <a class="rh-btn rh-btn--primary" href="about-me.html">Read my story <span class="rh-btn__arrow" aria-hidden="true">&rarr;</span></a>
      <a class="rh-btn rh-btn--ghost" style="color:#F7F5EF" href="resume.html">View my resume</a>
    </div>
  </div>
  <a class="rh-hero__scroll" href="#rh-ventures">Scroll</a>
</section>

<section class="rh-section rh-aurora-band" id="rh-ventures">
  <div class="rh-edge">
    <p class="rh-eyebrow rh-reveal">What I am building</p>
    <h2 class="rh-reveal" style="max-width:20ch">Three products, one habit: ship it, then make it good.</h2>
    <p class="rh-lede rh-reveal" style="margin-bottom:3rem">I would rather have something running badly on a real server than something perfect in a document. Every project below started as a weekend idea and ended up as software other people actually use.</p>
    <div class="rh-grid rh-grid--3">{vcards}</div>
  </div>
</section>

<section class="rh-section rh-section--alt">
  <div class="rh-edge">
    <p class="rh-eyebrow rh-eyebrow--center rh-reveal" style="justify-content:center">By the numbers</p>
    <div class="rh-stats rh-reveal">{scards}</div>
  </div>
</section>

<section class="rh-section">
  <div class="rh-edge">
    <p class="rh-eyebrow rh-reveal">Start anywhere</p>
    <h2 class="rh-reveal" style="margin-bottom:2.5rem">The rest of the site</h2>
    <div class="rh-grid rh-grid--2">{dcards}</div>
  </div>
</section>
"""

# ---------------- INTERIOR PAGES ----------------
def article(body):
    return f'<section class="rh-section"><div class="rh-edge"><div class="rh-article">{body}</div></div></section>'

about = pagehead("Roman Heuser","About Me","Founder, student, and the person who answers the support email.") + article(read("about-me.html"))

resume_body = read("resume.html")
resume_body = resume_body.replace('[pdf-embedder url="((MEDIA URL: resume-original.pdf))" title="Roman Heuser Resume — Original"]',
    '<iframe src="../resume/resume-original.pdf#toolbar=0" style="height:840px" title="Resume — Original"></iframe>')
resume_body = resume_body.replace('[pdf-embedder url="((MEDIA URL: resume-ai-refined.pdf))" title="Roman Heuser Resume — Product Manager version"]',
    '<iframe src="../resume/resume-ai-refined.pdf#toolbar=0" style="height:840px" title="Resume — Product"></iframe>')
resume_body = resume_body.replace("((MEDIA URL: resume-original.pdf))","../resume/resume-original.pdf")
resume_body = resume_body.replace("((MEDIA URL: resume-ai-refined.pdf))","../resume/resume-ai-refined.pdf")
resume = pagehead("Roman Heuser","Resume","Two versions of the same experience, and the prompts that produced the second.") + article(resume_body)

gal_body = read("gallery.html").replace("((GALLERY SHORTCODE GOES HERE))",
  '<div class="rh-grid rh-grid--3" style="gap:1rem">' +
  "".join(f'<div style="aspect-ratio:4/3;border-radius:var(--rh-radius);background:linear-gradient(135deg,var(--rh-bg-alt),var(--rh-mist-deep));border:1px dashed var(--rh-line);display:grid;place-items:center;color:var(--rh-text-muted);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase">Photo {i}</div>' for i in range(1,6)) +
  "</div>")
gallery = pagehead("Roman Heuser","Gallery","Five photographs, all mine.") + article(gal_body)

post = read("blog-post.html")
post = read("blog-post.html")
blog = pagehead("Blog", "The Restaurant With 400 Perfect Reviews and No Customers",
                "Published August 2026 &middot; about 6 minutes to read") + f"""
<section class="rh-section"><div class="rh-edge"><div class="rh-article">
{post}
<nav class="rh-postnav" aria-label="More posts">
  <a class="rh-postnav__item rh-postnav__item--prev" href="blog.html">
    <span class="rh-postnav__dir">Previous</span>
    <span class="rh-postnav__title">Your next post goes here</span></a>
  <a class="rh-postnav__item rh-postnav__item--next" href="blog.html">
    <span class="rh-postnav__dir">Next</span>
    <span class="rh-postnav__title">And the one after that</span></a>
</nav>
<div id="rh-blog-demo"></div>
</div></div></section>"""

excel_widget = (ROOT / "chatbot" / "excel-gpt-chatbot.html").read_text()
excel_widget = re.sub(r"<!--.*?-->", "", excel_widget, flags=re.S).strip()
excel = pagehead("Excel Helper","Ask my Excel GPT","A Custom GPT trained on Microsoft Excel — ask it about formulas, PivotTables, charts, or the error you are stuck on.") + \
    f'<section class="rh-section"><div class="rh-edge">{excel_widget}</div></section>'

# ---------------- CHATBOT B (the plugin) ----------------
_php = (ROOT / "chatbot" / "rh-excel-gpt" / "rh-excel-gpt.php").read_text()
_m = re.search(r'<div class="rhxg" id="rhxg-root".*?</div>\s*\n\t<\?php', _php, re.S)
_w = _m.group(0).replace("\n\t<?php", "")
_w = re.sub(r"<\?php echo esc_attr\(.*?\); \?>", "1", _w)
_w = re.sub(r"<\?php esc_attr_e\(\s*'(.*?)',.*?\); \?>", r"\1", _w)
_w = re.sub(r"<\?php esc_html_e\(\s*'(.*?)',.*?\); \?>", r"\1", _w)
_w = re.sub(r"<\?php if \( \$o\['gpt_url'\] \) : \?>.*?<\?php endif; \?>",
            '<p class="rhxg__foot"><a href="#" target="_blank" rel="noopener noreferrer">'
            'Open the full Custom GPT &#8599;</a></p>', _w, flags=re.S)

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
  <p><a href="excel-helper.html">Compare it with Chatbot A &rarr;</a></p>
</div></div></section>
""" + _w + """
<script>
var RHXG = { endpoint:'/wp-json/rh-excel-gpt/v1/chat', nonce:'dev', live:1,
  greeting:'Hi — I am an Excel assistant. Ask me about formulas, PivotTables, charts, or the error message you are stuck on.',
  gptUrl:'#' };
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
 "excel-helper.html": ("Chatbot A", excel),
 "chatbot-b.html": ("Chatbot B", botb),
}
OUT.mkdir(exist_ok=True)
for fn,(title,body) in PAGES.items():
    (OUT/fn).write_text(chrome(title, fn, body))
    print("wrote preview/"+fn)
