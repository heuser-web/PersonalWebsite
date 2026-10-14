# IS101 Personal Website — Build Guide

Everything in this folder is ready to use. This guide is the order to use it in.
Budget about **3 focused hours** for the whole build, plus a day of waiting on
friends to leave blog comments.

**Read this first:** two things in this kit are deliberately unfinished because
only you can finish them — your **five gallery photos** (they must be your own)
and the **Lab #3 Custom GPT link**. Everything else is done.

---

## Before you start

- [ ] Hosting is signed up and paid for. **Deadline: September 2, 11:59pm — missing it is a 50-point deduction.**
- [ ] You uploaded the signup/receipt screenshot to Canvas.
- [ ] You have your hosting control panel login (Webtaculous or GreenGeeks/InMotion/Bluehost).
- [ ] **Not GoDaddy.** Hosting there is prohibited for this project.

---

## Step 1 — Install WordPress yourself

This is the step that decides whether you get a grade at all. The project is a
**zero** if the site is built on Wix, Weebly, Squarespace, Shopify,
WordPress.com, or GoDaddy's builder. It must be a standalone WordPress install
on your own host.

1. Log in to your hosting control panel (usually cPanel).
2. Find **WordPress Toolkit**, **Softaculous**, or **WordPress Manager**.
3. Click **Install** / **Install WordPress**.
4. Settings:
   - **Protocol:** `https://` (pick the `www`-less version)
   - **Directory:** leave **blank** so the site lives at the root, not `/wp/`
   - **Site Name:** `Roman Heuser`
   - **Site Description:** `Founder · Builder · Student`
   - **Admin Username:** *not* `admin` — pick something else
   - **Admin Password:** save it somewhere you will not lose it
   - **Admin Email:** your real email
5. Install. Write down the admin URL: `yoursite.com/wp-admin`.

> Take a screenshot of the finished install screen. It is proof of the standalone
> install if anything is ever questioned.

---

## Step 2 — Baseline settings (5 minutes, saves hours later)

In the WordPress dashboard:

**Settings → General**
- Site Title: `Roman Heuser`
- Tagline: `Founder · Builder · Student`
- Timezone: `Los Angeles` (Pacific)

**Settings → Permalinks**
- Choose **Post name**. Do this *before* you create pages — it makes your URLs
  `/about-me/` instead of `/?page_id=7`.

**Settings → Discussion** — this one matters for your blog grade:
- ☑ Allow people to submit comments on new posts
- ☑ Comment author must fill out name and email
- ☑ Comment must be manually approved  ← you need this so you can *approve* comments, which the rubric asks for
- ☐ **Uncheck** "Users must be registered and logged in to comment" — otherwise your friends cannot comment
- Enable threaded comments, **5 levels deep**

**Settings → Reading** — come back to this in Step 6.

---

## Step 3 — Install the Heuser theme

Your theme is in `theme/roman-heuser/`. It is a custom theme built from scratch
for this project — not a "Twenty" theme, and not a stock download, which is
exactly what the rubric's *Quality Site w/Customized Theme* line is looking for.

1. Zip it: in Finder, open the `theme` folder, right-click `roman-heuser` →
   **Compress**. You get `roman-heuser.zip`.
   *(A pre-made `build/roman-heuser.zip` is already in this kit if you prefer.)*
2. In WordPress: **Appearance → Themes → Add New → Upload Theme**.
3. Choose the zip → **Install Now** → **Activate**.

You should immediately see a dark hero and brass accents.

### If the upload is blocked
Some hosts cap upload size. Then use **cPanel → File Manager**:
upload the zip to `/public_html/wp-content/themes/`, right-click → **Extract**,
then activate under Appearance → Themes.

---

## Step 4 — Your logo and site icon

Your logo is in the `logo/` folder. Four PNGs, each for a different job:

| File | Use it for |
|---|---|
| `roman-heuser-logo-compact.png` | **The header** — monogram + name, stays legible when small |
| `roman-heuser-logo-light.png` | **The hero and footer** — light version for dark backgrounds |
| `roman-heuser-logo.png` | Full lockup with the tagline, for anywhere you need it large |
| `site-icon-512.png` | The browser tab icon |

1. **Appearance → Customize → Site Identity**
2. **Select Logo** → Upload `roman-heuser-logo-compact.png` → **Skip cropping**
3. **Select Site Icon** → Upload `site-icon-512.png`
4. **Publish**

> The theme automatically uses the light version in the hero and footer, so you
> only upload the compact one here.

---

## Step 5 — Create the five pages

**Pages → Add New**, once for each. Title them **exactly** like this — the theme
and the menu both look for these names:

| Title | Content to paste |
|---|---|
| `Home` | *(leave empty — the theme builds it)* |
| `About Me` | `content/about-me.html` |
| `Resume` | `content/resume.html` |
| `Gallery` | `content/gallery.html` |
| `Blog` | *(leave empty — WordPress fills it with your posts)* |

**How to paste the content:**

1. Create the page and give it the title.
2. Click the **+** button → search for **Custom HTML** → insert that block.
3. Open the matching `.html` file in TextEdit, select all, copy.
4. Paste into the Custom HTML block.
5. **Publish.**

Then go back through **About Me** and **Gallery** and replace every `((...))`
marker with your own words, photos and captions. They are impossible to miss —
that is the point.

**Optional sixth page:** `Excel Helper` — see Step 11.

---

## Step 6 — Point WordPress at the right pages

**Settings → Reading**
- Your homepage displays: **A static page**
- Homepage: **Home**
- Posts page: **Blog**
- Save.

This is what makes `/` show your hero and `/blog/` show your posts.

---

## Step 7 — The custom menu (8 rubric points, exact order required)

**Appearance → Menus**

1. Create a new menu. Name it `Primary`.
2. Add all five pages.
3. Drag them into **exactly** this order — the rubric checks it:

   **Home | About Me | Resume | Gallery | Blog**

4. Under **Menu Settings**, tick **Primary Menu** as the display location.
5. Save Menu.

> If you added the Excel Helper page, put it **after Blog** so the required five
> stay in the required order.

---

## Step 8 — Widgets (7 rubric points)

The rubric wants *site-relevant* widgets and explicitly calls out Search, Recent
Posts, Recent Comments, Archives, Categories and Meta as clutter to remove.

**The theme already handles most of this.** It unregisters the junk widgets at
the code level and ships a footer that looks finished with nothing added — logo,
blurb, social icons, an Explore menu, and contact details.

To go further and earn the points cleanly:

**Appearance → Widgets**
1. Delete anything sitting in a widget area by default.
2. **Footer — Column 2:** add a **Navigation Menu** widget → choose `Primary` → title it `Explore`.
3. **Footer — Column 3:** add a **Text** widget → title it `Get in touch` → put your email, city, and school in it.

That is a footer full of things that matter on a personal site, and zero
leftover blog furniture.

---

## Step 9 — The three required plugins (30 rubric points)

**Plugins → Add New**, search, **Install**, **Activate**. Use whichever plugins
your lab covered; these are reliable defaults if you have a choice.

### 9a. PDF embed → **PDF Embedder**
Needed for the Resume page.

1. **Media → Add New** → upload `resume/resume-original.pdf` and
   `resume/resume-ai-refined.pdf`.
2. Click each one and **copy its File URL**.
3. Edit your **Resume** page and replace the two
   `((MEDIA URL: ...))` markers with the matching URLs. There are **four**
   replacements total — two in the shortcodes and two in the Download links.

> **If the shortcode shows as plain text** instead of a PDF, your Custom HTML
> block is not running shortcodes. Fix: split the page into blocks — keep the
> text in the Custom HTML block, and add a separate **Shortcode** block for each
> `[pdf-embedder ...]` line. Both PDFs still appear in the right order.

### 9b. Social media → **Social Icons Widget by WPZOOM**
1. **Appearance → Customize → Heuser Theme Options → Social Links**
2. Paste in the URLs you actually have — LinkedIn, GitHub, Instagram, X, YouTube.
   Leave the rest blank; the theme only renders the ones you fill in.
3. The icons appear in your footer automatically.
4. Then **also** place the plugin's widget or block somewhere visible (the
   footer or the About page) so there is no doubt a social plugin is in use.

### 9c. Gallery → **Modula** *(or Envira Gallery Lite)*
1. **Modula → Add New Gallery**, upload **3 to 5 of your own photos**.
2. Publish, copy the shortcode (looks like `[modula id="123"]`).
3. Edit your **Gallery** page and replace `((GALLERY SHORTCODE GOES HERE))`
   with it — again using a **Shortcode block** if it does not run inside the
   Custom HTML block.

> The photos must be yours. Not stock, not Google Images — that is a copyright
> problem the assignment calls out directly.

---

## Step 10 — The blog post, comments and replies (30 rubric points)

### The post
1. **Posts → Add New**
2. Title: **The Restaurant With 400 Perfect Reviews and No Customers**
3. Add a **Custom HTML** block and paste `content/blog-post.html`.
4. Right sidebar → **Discussion** → make sure **Allow comments** is ticked.
5. Publish.
6. Delete the default "Hello world!" post: **Posts → Hello world! → Trash**.

### The four comments
Open `content/comments-and-responses.md`. It has the exact texts to send four
different people, and the reply pattern that earns full credit.

- Send four *different* people the link. They must post in their own words from
  their own devices — four comments from one browser is obvious.
- **Dashboard → Comments → Approve** each one as it lands.

### The four replies
- Stay **logged in as yourself**, then hit **Reply** on each comment.
- Being logged in is what gives your replies the brass **Author** badge and the
  proper threaded indent. Both make it instantly clear to your professor that
  there are four comments *and* four responses.

---

## Step 11 — The Excel Custom GPT chatbot (30 rubric points)

You have **two** working chatbots. Read `chatbot/CHOOSING.md` for the full
comparison — the short version is below.

### The part that is not optional

The rubric says *"You must use the GPT Chatbot and prompts covered in Lab #3."*
So whichever chatbot you ship, do these three things:

1. **Embed your Lab #3 Custom GPT the way the lab taught it.** Do not substitute
   my work for it.
2. **Paste your Lab #3 system prompt** into the plugin's System prompt field, so
   the live bot is running the Lab 3 prompt.
3. **Put your Custom GPT share link** in the plugin settings.

### Option A — inline widget (no cost, no setup)

1. Open `chatbot/excel-gpt-chatbot.html`, replace all 3 occurrences of
   `YOUR_CUSTOM_GPT_URL_HERE` with your Lab #3 GPT link.
2. Create a page called **Excel Helper**, add a **Custom HTML** block, paste the
   file, publish.

26 Excel topics answered on-page, keyword-matched. Never breaks, never costs
anything, but it is not a real language model.

### Option B — the plugin (a live GPT)

1. **Plugins → Add New → Upload Plugin** → `build/rh-excel-gpt.zip` → Activate.
2. **Settings → Excel GPT**: tick Enable, choose provider, paste your API key,
   set the model, paste your Lab 3 system prompt, add your Custom GPT link.
3. Put `[rh_excel_gpt]` on the Excel Helper page.

A floating launcher appears bottom-right. It holds a real conversation with
follow-up context, and refuses off-topic questions per the system prompt.

**A ChatGPT Plus subscription is not API access** — the API bills separately and
needs a card. If you would rather not, leave Enable unticked: the plugin still
renders and points at your Custom GPT.

### What I would ship

Both, on the same page — the plugin as the working assistant, the inline widget
below it. If the API key ever runs dry, the page still has a working Excel
assistant on it.

### Then add it to the menu

Put **Excel Helper** in the menu **after Blog**, so the required five pages stay
in the required order.

## Step 12 — Make the hero yours

**Appearance → Customize → Heuser Theme Options**

- **Home Hero** — the headline, subtitle, buttons, and a background photo. Wrap a
  word in `<em>` to make it brass italic, like `I build things that <em>ship</em>.`
  Upload a wide photo (2000px+) of Las Vegas, Reno, or your workspace. It sits
  behind a dark wash, so almost any photo works.
- **Social Links** — see Step 9b.
- **Footer** — your blurb and contact email.
- **Colors** — the accent color drives every button, rule and eyebrow on the
  site. Brass `#C9A227` is the default; change it once and the whole site follows.

---

## Step 13 — Final QA

Walk `RUBRIC-CHECKLIST.md` line by line. Then, on a phone:

- [ ] Every menu item opens the right page
- [ ] The mobile menu button opens and closes
- [ ] Both PDFs display on the Resume page
- [ ] The gallery shows your photos
- [ ] The blog post shows 4 comments and 4 replies
- [ ] The chatbot answers a question and the GPT button opens your Lab #3 GPT
- [ ] No `((...))` markers are left anywhere on the live site  ← **check this twice**
- [ ] No "Hello world!" post and no "Sample Page"

---

## Local preview

Open `preview/index.html` in your browser to see the finished design without
touching WordPress. It is the same CSS the theme uses, so what you see is what
you will get.

---

## Step 14 — The cinematic layer

The theme ships an optional cinematic layer: the opening sequence, a WebGL
particle galaxy behind the hero, glass cards, and gradient section washes. It is
two files — `assets/css/cinematic.css` and `assets/js/cinematic.js`. **Delete
both and the site falls back to the clean base theme with nothing broken.**

### The opening sequence

Not a Star Wars crawl — a modern cold open, about 14 seconds:

| # | Beat | What happens |
|---|---|---|
| 1 | Terminal | `$ whoami` types itself, prints your line, then `$ launch --site` |
| 2 | Hyperspace | Stars accelerate into streaks, speed ramping on a curve |
| 3 | Punch | White flash, streaks decay |
| 4 | Name | Your name resolves out of an RGB channel-split with an anamorphic flare raking across it |
| 5–7 | Statement cards | Three claims, each punching in and blurring out |
| 8 | Sign-off | Your logo and a closing line, then it dissolves into the site |

Edit every line of it in **Appearance → Customize → Heuser Theme Options →
Opening Sequence**. The three statement cards use a pipe format:

```
lead text | highlighted text | subtitle
```

The highlight renders in the brass gradient. Leave it empty with two pipes
(`Seven agents.||One perfect night`) to skip it.

### How it behaves

| Situation | What happens |
|---|---|
| First visit in a tab | Plays in full, about 14 seconds |
| Second page view | Skipped — remembered per browser tab |
| **Skip**, Escape, or any scroll | Ends immediately |
| "Reduce motion" enabled | Never mounts at all |
| WebGL unavailable | Hero galaxy is skipped; the sequence still runs (it is 2D canvas) |
| Anything throws | A failsafe timer removes the overlay regardless |
| Replay | Circular button, bottom-right of the home page |

A progress hairline runs along the bottom so visitors can see it has an end.

**Debug hook:** add `?intro=9600` to the home page URL to freeze the sequence at
exactly 9.6 seconds. Handy for checking a copy change without watching the whole
thing.

### The generated backgrounds

`assets-generated/` holds three images made with AI for this build:

| File | Where it is used |
|---|---|
| `vegas-night.jpg` | Home hero background (bundled into the theme as a fallback) |
| `mesh.jpg` | Interior page headers |
| `nebula.jpg` | Spare deep-space backdrop |

**These must not go in your Gallery.** That page is graded on being *your own*
photographs. Using them as site chrome is normal; using them as your gallery
would misrepresent them.

### One honest caution

The project brief says *"you do not need … elaborate animations"* and *"simple
and polished is almost always better than complicated and cluttered."* This layer
is deliberately more than the rubric asks for.

It is built so it cannot cost you points: the crawl is skippable and never
blocks the content, every required page is one click from the hero, the menu
order is untouched, mobile is unaffected, and turning it off is deleting two
files. If your professor prefers restraint, delete `cinematic.css` and
`cinematic.js` from the theme folder and everything reverts.
