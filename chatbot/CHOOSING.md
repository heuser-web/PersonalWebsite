# The Excel chatbots: what to ship

All of them now share one knowledge base (`chatbot/src/`), so they never disagree.

| | **Panel** `[rh_excel_helper]` | **Floating button** `[rh_excel_gpt]` | **Your Lab #3 GPT** |
|---|---|---|---|
| Where | In the page | Corner of the page | chatgpt.com, linked from the site |
| Needs a key | No | No | No |
| Answers Excel questions | Yes, 93 topics and 208 functions | Same | Yes, live model |
| Checks a pasted formula | Yes | Yes | Yes |
| Writes a formula from a sentence | Common patterns | Same | Anything |
| Quiz | Yes | Yes | Yes |
| With an API key | Becomes a live GPT | Becomes a live GPT | n/a |
| If the live model fails | Built-in answer | Built-in answer | n/a |
| After 11 December 2026 | Keeps working | Keeps working | **Page goes offline** |

## What I would ship

1. Install the plugin (`build/rh-excel-gpt.zip`).
2. On the Excel Helper page put `[rh_excel_helper]`. One chat on the page is enough.
3. Upgrade your Lab #3 GPT with `chatbot/custom-gpt/SETUP.md` and paste its link in **Settings → Excel GPT**.
4. Optional: add an API key and the panel becomes a live GPT.

No plugin? Paste `chatbot/excel-gpt-chatbot.html` into a Custom HTML block. It is the same panel.

## What decides the 30 points

The rubric says: *You must use the GPT Chatbot and prompts covered in Lab #3.* The panel is not that chatbot, and without an API key it is not a GPT. It says so itself if asked. So:

1. Embed or link your **Lab #3 GPT** the way the lab taught it.
2. Keep your **Lab #3 prompt** at the top of its instructions.
3. If you add an API key, paste that same prompt at the top of **Settings → Excel GPT → System prompt**.

A custom GPT cannot be put in an iframe, because chatgpt.com blocks it. The button is the working way.

## Changing answers

Edit `chatbot/src/topics.md`, then run `npm run chatbot` and `npm run test:chatbot`.
