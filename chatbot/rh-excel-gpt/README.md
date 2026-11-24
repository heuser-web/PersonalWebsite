# Excel Helper: WordPress plugin

An Excel assistant that answers questions, checks formulas and writes them. It works with no setup. Add an API key and it answers with a live model, with the key kept on your server.

## Install

1. **Plugins → Add New → Upload Plugin** → `build/rh-excel-gpt.zip` → Install → Activate.
2. Put a shortcode on a page:
   - `[rh_excel_helper]` a panel in the page
   - `[rh_excel_gpt]` a floating button
3. **Settings → Excel GPT**: paste your Lab #3 GPT link. The link hides itself on the date OpenAI retires custom GPT pages.

## Optional: the live model

Tick **Enable**, choose a provider, paste a key.

| Provider | Model | Price per million tokens, in / out (checked 23 Nov 2026) |
|---|---|---|
| OpenAI | `gpt-6-luna` | $0.10 / $0.50 |
| Anthropic | `claude-haiku-5-5` | from $0.10 / $0.50 |

`gpt-4o-mini` shuts down on 14 January 2027, so it is no longer the default. A ChatGPT Plus subscription is not API access; the API bills separately and needs a card.

Two limits protect the bill: 20 questions per visitor per hour, and 300 a day for the whole site.

## What visitors see when something fails

Never an error. If the key is missing, the limit is hit, or the provider is down, the question is answered from the built-in knowledge with a short note. Only a signed-in administrator sees the provider's error text.

## Why a plugin and not a script on the page

A key in front-end JavaScript can be read by anyone with View Source. Here the browser calls `/wp-json/rh-excel-gpt/v1/chat` on your own domain, and your server adds the key.

## The prompt

**Settings → Excel GPT → System prompt**. Paste your Lab #3 prompt at the top and keep the rules under it. Clear the box and save to restore the shipped prompt.

## Files

```
rh-excel-gpt.php        settings, REST proxy, shortcodes
system-prompt.txt       the shipped prompt
assets/excel-brain.js   the engine (generated, edit chatbot/src/)
assets/rhxg.js, .css    the floating button
views/                  markup for both shortcodes (helper.html is generated)
```
