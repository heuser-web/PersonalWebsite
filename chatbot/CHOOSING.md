# Two chatbots — which one to ship

You have two working Excel chatbots. They solve the same rubric line
(**Embedded GPT ChatBot with Microsoft Excel info — 30 pts**) in opposite ways.

| | **A · Inline widget** | **B · WordPress plugin** |
|---|---|---|
| File | `excel-gpt-chatbot.html` | `rh-excel-gpt/` (+ `build/rh-excel-gpt.zip`) |
| Install | Paste into a Custom HTML block | Upload plugin, activate, add `[rh_excel_gpt]` |
| Where it sits | Inline panel in the page | Floating launcher, bottom-right of every page it's on |
| How it answers | 26 built-in Excel topics, keyword-matched | **A real language model**, live |
| Follow-up questions | No — each question is independent | Yes, keeps six turns of context |
| Off-topic questions | Falls back to a canned message | Politely refuses and steers back, per the system prompt |
| Cost | £0 / $0, forever | Pennies, but needs an API key with a card on file |
| Can it break? | Practically no. No network, no key, no dependency | Yes — bad key, no credit, API outage |
| API key exposure | N/A | **None.** Key stays server-side, proxied through your own domain |
| Works offline | Yes | No |

## What I'd actually do

**Ship B as the main one, and keep A on the same page underneath it.**

The rubric says *"Embedded GPT ChatBot."* Chatbot A is a good fake — it answers
26 Excel topics well, but it is keyword matching, not generation. If your
professor asks it something off-script, it says "I don't have an answer for
that." Chatbot B is a genuine GPT and will answer anything Excel-shaped.

Keeping A below B costs you nothing and means that if the API key runs dry the
day it gets graded, there is still a working Excel assistant on the page.

## What actually decides your 30 points

Neither of these is the Lab #3 chatbot, and the rubric explicitly says:

> *You must use the GPT Chatbot and prompts covered in Lab #3*

So do this, in order:

1. **Embed your Lab #3 Custom GPT the way the lab taught it.** That satisfies the
   literal requirement. Don't substitute my work for it.
2. **Paste your Lab #3 system prompt into the plugin** — Settings → Excel GPT →
   System prompt. Now the plugin *is* running the Lab 3 prompt, which connects
   the two directly.
3. **Put your Custom GPT share link in the plugin settings** so the footer links
   to it.

Do those three and you are demonstrably using the Lab 3 material, with a live
implementation on top. That is the difference between "followed instructions"
and "followed instructions and then went further" — and only the second one gets
extra credit.

## If you don't want to add a payment method

Leave the plugin's **Enable** box unticked and ship Chatbot A as the working
assistant. The plugin still renders, still looks finished, and points at your
Custom GPT. You lose live answering; you lose nothing visually.
