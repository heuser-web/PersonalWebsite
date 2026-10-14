# Facts to verify before you publish

I built your content from what is actually in your files — your GoMojo pitch
deck, the TagData and GoInvest project docs, your vCard, and your own messages
about going to UNR. That covers most of it accurately.

Below is everything I either **inferred** or **could not know**. Fix these and
the site is factually yours.

---

## 🔴 Must fix — the site says something I guessed

| # | What the site says | Where | Why I said it | Action |
|---|---|---|---|---|
| 2 | **Tom and Serena Heuser are your parents** | About Me, opening section | Your repo has The Heuser Team (Tom & Serena, Las Vegas real estate) and you share a surname. I wrote "my parents" | **Confirm the relationship.** If they are not your parents, rewrite that paragraph |
| 4 | **You personally found manipulated review data while building GoMojo** | Blog post | You built a recommender on review data, so it is plausible — but I wrote it as a first-person experience | **Confirm this actually happened to you.** If not, see the note below |
| 5 | **"15 AI agents in production"** | Home page stat | 7 GoMojo agents + 8 GoInvest personas | Confirm the math still holds |

### About #4 — the blog post

The assignment asks for something you have **seen or experienced**. The post is
written in your voice about review manipulation you noticed while building
GoMojo's recommendation engine. If that is close to true, keep it and adjust the
details until it is exactly true.

If it is not, do not submit it as written. Two honest options:

- **Rewrite the framing** to what you actually saw — a phishing text, a fake
  Instagram giveaway, a crypto pump, a fake job offer, a scam that hit someone in
  your family. Keep the structure (purpose → how it worked → how to spot it) and
  swap the story.
- **Keep the topic, change the stance** — "here is a manipulation pattern I read
  about and then went looking for in my own data."

The structure is what earns the points. The story has to be yours.

---

## 🟡 Job details I had to approximate

You gave me the jobs but not every title or date. These are my best reading —
correct anything wrong before you publish, since they are on both PDFs.

| Job | What I wrote | Check |
|---|---|---|
| Nevada Premier Valet | Valet Attendant &middot; Aug 2026 – Present | You said you started last week |
| Pressure washing | Owner &amp; Operator &middot; `((2025))` – Present, self-employed | **When did you actually start?** |
| Lee Canyon | Grill Cook &middot; Summer `((2026))` | You said burgers, so I wrote grill. Which summer? |
| Maggiano's Little Italy | **Restaurant Team Member** &middot; `((2025))` – Dec 2025 | **You did not say your title.** Server, busser, host and line cook all read differently to an employer — put the real one in |

I also assumed **B.S. Business Administration, expected 2030** (freshman + four
years). If you are in a named concentration — Finance, Marketing, Supply Chain —
say so; it is more specific and reads better than plain "Business."

---

## 🟡 Blanks I left for you — search for `((` and fill them in

| Where | What is missing |
|---|---|
| Both resumes | `((2030))` — confirm your expected graduation year |
| Both resumes | `((GPA))` — **include only if 3.3 or above, otherwise delete the line** |
| Both resumes | `((START))` dates for GoMojo, GoInvest and TagData; `((2025))` for the pressure washing and Maggiano's start |
| Both resumes | Your **TagData job title** — I used "Frontend Design Lead". Change it to whatever your offer letter or LinkedIn says |
| About Me | Two `((UPLOAD: photo))` markers + captions |
| About Me | The "Beyond the screen" paragraph — hobbies, sports, music, travel. **I would not invent this** |
| Gallery | Five photo titles and one-line captions |
| Gallery | Your gallery plugin shortcode |
| Resume page | Four `((MEDIA URL))` markers, after you upload the PDFs |
| Chatbot | `YOUR_CUSTOM_GPT_URL_HERE` — **all 3 occurrences** |

To regenerate the PDFs after editing the resume HTML files:

```
cd "/Users/romansmac/Personal Website Project intro to information systems"
python3 build/render.py pdf "file://$PWD/resume/resume-original.html"   "$PWD/resume/resume-original.pdf"
python3 build/render.py pdf "file://$PWD/resume/resume-ai-refined.html" "$PWD/resume/resume-ai-refined.pdf"
```

---

## 🟠 The background images are AI-generated

`assets-generated/` holds three images I generated for this build — the Vegas
night hero, an abstract mesh for page headers, and a nebula. They are site
chrome, the same category as artwork bundled with any theme.

**Keep them out of the Gallery page.** That one is graded on the photos being
yours. If you would rather disclose them, one line in the footer covers it:
*"Background imagery generated with AI."*

---

## 🟠 A judgment call for you — your phone number

Both resumes carry **702-885-9747**, from your vCard. That is normal on a resume
you hand to an employer. It is different on a **public web page that will be
indexed by Google**, where it becomes permanent scraper food.

Your call. Three options:

1. Leave it — it is a real resume and employers expect a number.
2. Remove it from the PDFs and keep email only.
3. Keep the phone number in a download-only PDF and remove it from the embedded
   preview version.

I left it in. Delete the `<span>702-885-9747</span>` line in both resume HTML
files and re-render if you would rather not.

---

## 🟢 Verified from your own files — no action needed

- Roman Heuser · Las Vegas, NV · heuser@romanattitudeofgratitude.com · tagdata.co
- **GoMojo** — AI concierge, Romey, 7-agent swarm, ~6-second plans, Hidden Gems,
  Midway Meetup, happy hours, events, 3-tier membership (free / $5 Local /
  $10 Everywhere), Stripe, installable PWA, built for under $1,000, Reno + Sparks
  expansion planned
- **TagData** — *corrected by Roman 2026-08-27:* he was **hired** to recreate the
  frontend and given **full authority over the redesign**; the company has
  **$3.5M invested**. He is not a founder of it. The site, both resumes and the
  home page now say "Frontend Design Lead". Product details unchanged: personal
  data vault, 8 life domains, TagData ID master QR, shared data encoded in the
  link and never server-stored, ~1.6KB QR capacity limit, Next.js 15 / React 19 /
  Tailwind v4 front end, .NET 10 / EF Core / Postgres back end
- **GoInvest** — 8 investor personas incl. a forensic short-seller, council debate
  and vote, fractional Kelly + meta-labeling + HMM regime gate, every debate
  logged to SQLite, paper trading only, "educational, not investment advice"

---

## One academic-integrity note, said plainly

The prompt-engineering reflection on your Resume page describes three prompts and
what they changed. I wrote those prompts, and the AI-refined resume reflects the
kind of edits they would produce.

**Go run them.** Open ChatGPT, paste your original resume, run the three prompts
in `content/resume.html`, read what comes back, and adjust the refined resume and
the reflection to match what you actually got. It will take fifteen minutes, the
reflection becomes true, and it will almost certainly be *better* — the specific
critique you get back will beat anything I predicted.

The assignment is explicit that AI should suggest and you should edit. Right now
this kit has done the suggesting. Make the editing genuinely yours.
