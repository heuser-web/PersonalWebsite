# Facts to verify before you publish

I built your content from what is actually in your files — your GoMojo pitch
deck, the TagData and GoInvest project docs, your vCard, and your own messages
about going to UNR. That covers most of it accurately.

Below is everything I either **inferred** or **could not know**. Fix these and
the site is factually yours.

---

## 🟡 New with the photos (Nov 2026) — 2 minutes to check

| What | Where | Why it matters |
|---|---|---|
| The treenet photo came off **Meta smart glasses**, not your phone | Gallery 02, About Me, home | If a friend shot it, it is still fine to use — just make sure they are OK with it, because the rubric grades the photos as yours |
| **Dye is Life** shows ~150 identifiable people, bare chests, and red cups at a pong table | Gallery 03, home | Your professor, and anyone you send the link to later, will see it. It is your call; if you would rather keep the gallery work-safe, swap it for another of your own photos |
| Two images you sent are **not** on the site: the ΣΑΕ letters graphic and the code-on-a-monitor picture | — | Both look downloaded rather than taken by you, and the gallery is graded on being your own photos. The party photo already shows the SAE flag and banner on the house |

---

## 🟡 New on 2026-11-23 — LifeSwitch and your other projects

| What the site says | Where | Check |
|---|---|---|
| You are **co-founder** of LifeSwitch; your co-founder is a UNR student who had the idea. They are **not named** | Home, About | Right? Add the name only if they agree |
| Every LifeSwitch feature and number is taken from its **live public site** (2026-11-23) and nothing else | Home, About | Re-check if that site changes |
| The **link** to LifeSwitch is the Render address | Home card 1, About | Swap it when you buy the domain |
| Thirteen Reno businesses are listed as **redesign concepts, not official sites** | Home, About | Remove any owner who would not want to be named |
| GoGlobal, LifeStyle, the SAE site, The Heuser Team site and the Roblox kit are described from their own READMEs | Home, About | Read each line once |
| **Both resumes still list the older vault job.** The pages no longer do, so decide whether the resumes should match | Resume | Your call; I did not change your employment history |

---

## 🔴 Must fix — the site says something I guessed

| # | What the site says | Where | Why I said it | Action |
|---|---|---|---|---|
| 4 | **You personally found manipulated review data while building GoMojo** | Blog post | You built a recommender on review data, so it is plausible — but I wrote it as a first-person experience | **Confirm this actually happened to you.** If not, see the note below |
| 5 | **"15 AI agents built"** | Home page, desert scene | 7 GoMojo agents + 8 GoInvest personas. Softened from "in production" on 2026-11-23 | Confirm the math still holds |

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
| Pressure washing | Owner &amp; Operator &middot; Present, self-employed (no start year shown) | **When did you actually start?** |
| Lee Canyon | Grill Cook &middot; One summer (no year shown) | You said burgers, so I wrote grill. Which summer? |
| Maggiano's Little Italy | **Restaurant Team Member** &middot; 9 months, to Dec 2025 | **You did not say your title.** Server, busser, host and line cook all read differently to an employer — put the real one in |

I also assumed **B.S. Business Administration, expected 2030** (freshman + four
years). If you are in a named concentration — Finance, Marketing, Supply Chain —
say so; it is more specific and reads better than plain "Business."

---

## 🟡 Blanks I left for you — search for `((` in content/, and `DATE` in resume/

| Where | What is missing |
|---|---|
| Both resumes | Expected graduation year. The PDFs now say "Fall 2026 – Present" instead of a printed blank |
| Both resumes | `((GPA))` — **include only if 3.3 or above, otherwise delete the line** |
| Both resumes | Start dates. Unknown ones are left off so visitors never see a raw `((START))`; each spot is marked with a `<!-- DATE ... -->` comment |
| Both resumes | Your **TagData job title** — I used "Frontend Design Lead". Change it to whatever your offer letter or LinkedIn says |
| About Me | Two `((MEDIA URL: ...))` image markers — upload `gallery/reno-sunset.jpg` and `gallery/treenet.jpg`, paste their URLs |
| Gallery | Your gallery plugin shortcode |
| Resume page | Four `((MEDIA URL))` markers, after you upload the PDFs |
| Chatbot | Your Lab #3 GPT link, in **Settings → Excel GPT** (or `YOUR_CUSTOM_GPT_URL_HERE`, once, if you paste the HTML instead) |

To regenerate the PDFs after editing the resume HTML files:

```
cd "/Users/romansmac/Personal Website Project intro to information systems"
python3 build/render.py pdf "file://$PWD/resume/resume-original.html"   "$PWD/resume/resume-original.pdf"
python3 build/render.py pdf "file://$PWD/resume/resume-ai-refined.html" "$PWD/resume/resume-ai-refined.pdf"
```

---

## 🟠 The background images are AI-generated

`assets-generated/` holds five AI-generated images — the two Drive plates, the old Vegas
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

- *Confirmed by Roman 2026-11-23:* brother of SAE; Tom and Serena are his parents;
  drives a carbon Mazda CX-30 with red interior and subwoofers
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
