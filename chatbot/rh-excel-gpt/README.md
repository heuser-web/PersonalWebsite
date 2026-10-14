# Excel GPT Assistant — WordPress plugin

A floating Excel chatbot backed by a real language model, with the API key kept
on your server.

## Install

1. Zip the `rh-excel-gpt` folder (or use `build/rh-excel-gpt.zip`).
2. **Plugins → Add New → Upload Plugin** → choose the zip → Install → Activate.
3. **Settings → Excel GPT** and fill in:
   - **Enable** — tick it
   - **Provider** — OpenAI or Anthropic
   - **API key** — see the note below
   - **Model** — e.g. `gpt-4o-mini` (OpenAI) or `claude-sonnet-5` (Anthropic).
     Set it to a model your account can actually call.
   - **Your Lab #3 Custom GPT** — the share link, used in the footer and as the
     fallback when the live model is off
   - **Rate limit** — 20/hour per visitor
   - **Daily cap** — 300/day site-wide; this is the one that actually protects your bill
4. Put `[rh_excel_gpt]` on the page where you want it.

## About the API key

**A ChatGPT Plus subscription is not API access.** They are separate products
with separate billing. To use the live model you need a key from
`platform.openai.com` (OpenAI) or `console.anthropic.com` (Anthropic), which
requires adding a payment method.

For a class project the spend is trivial — a few hundred short answers costs
well under a dollar on a small model — but it is not zero, and the rate limit
exists so a crawler cannot run it up.

**If you would rather not add a card:** leave **Enable** unticked. The assistant
still appears and still looks finished; it simply points visitors at your Custom
GPT instead of calling the API.

## Why a plugin instead of a script on the page

If the key sits in front-end JavaScript, anyone can open View Source and take it.
That is a real problem on a public site — stolen keys get used.

This plugin keeps the key in your WordPress database. The browser calls
`/wp-json/rh-excel-gpt/v1/chat` on your own domain; your server adds the key and
forwards the request. Nothing secret is ever sent to a visitor.

Also included: two independent rate limits (per visitor per hour, and a hard
site-wide daily cap — a per-IP limit alone does nothing against many addresses),
message length caps, a six-turn history window to hold down cost, and input
sanitising on everything that crosses the boundary.

## The prompt engineering part

**Settings → Excel GPT → System prompt** is where the behaviour is defined. The
shipped prompt does four things worth keeping:

1. Restricts it to Excel, so it will not wander off-topic
2. Asks for the formula or click path first, explanation second
3. Tells it to warn about the classic beginner traps
4. Forbids inventing functions that do not exist

That prompt is the actual assignment content. Edit it, ask the bot something,
watch the answers change — that is the exercise.

## Files

```
rh-excel-gpt.php     settings screen, REST proxy, shortcode
assets/rhxg.css      floating launcher + panel styling
assets/rhxg.js       front end; talks only to your own site
```
