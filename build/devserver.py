#!/usr/bin/env python3
"""Local dev server for the IS101 preview.

Serves the static preview AND implements the same REST contract the WordPress
plugin uses:

    POST /wp-json/rh-excel-gpt/v1/chat   {"message": "...", "history": [...]}
        -> {"reply": "..."}  |  {"error": "..."}

So the plugin's real front-end JavaScript can be exercised end to end before
WordPress exists anywhere.

Two modes:
  * LIVE     - set OPENAI_API_KEY or ANTHROPIC_API_KEY and it calls the real
               model with the plugin's real system prompt.
  * OFFLINE  - no key set; answers from a small built-in set so the UI, the
               multi-turn flow and the error paths are all still testable.

    python3 build/devserver.py [port]
"""
import json, os, sys, urllib.request, urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8155

SYSTEM = (
    "You are an expert Microsoft Excel tutor embedded on a student's personal website.\n\n"
    "Rules:\n"
    "- Answer ONLY questions about Microsoft Excel, spreadsheets, and closely related data work. "
    "If asked about anything else, say so politely in one sentence and steer back to Excel.\n"
    "- Be concise. Lead with the formula or the click path, then explain briefly.\n"
    "- Show formulas on their own line, exactly as they would be typed.\n"
    "- When a beginner is likely to hit a common mistake (absolute references, exact-match lookups, "
    "sorting a single column), warn them.\n"
    "- Never invent an Excel function that does not exist.\n"
    "- Keep answers under about 200 words unless asked for more."
)

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
ANTHRO_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
OPENAI_MODEL = os.environ.get("RHXG_MODEL", "gpt-4o-mini")
ANTHRO_MODEL = os.environ.get("RHXG_MODEL", "claude-sonnet-5")

# ---- offline answers: enough to exercise the UI honestly -------------------
OFFLINE = [
    (("vlookup",), "**VLOOKUP** looks up a value in the first column of a range and returns "
        "something to its right.\n\n`=VLOOKUP(A2, $D$2:$F$50, 3, FALSE)`\n\n"
        "Always end with `FALSE` for an exact match, lock the table with `$` (F4), and remember "
        "it can only look right. If your answer sits left of the lookup column, use XLOOKUP or "
        "INDEX/MATCH instead."),
    (("xlookup",), "**XLOOKUP** replaces VLOOKUP and searches in any direction.\n\n"
        "`=XLOOKUP(A2, D:D, F:F, \"Not found\")`\n\nExact match is the default, the 4th argument "
        "handles misses so you do not need IFERROR, and inserting a column will not break it. "
        "Needs Microsoft 365 or Excel 2021."),
    (("pivot",), "**PivotTable:** click any cell in your data, then Insert → PivotTable → OK.\n\n"
        "Drag a text field to Rows, a number field to Values. Right-click → Refresh after the "
        "source changes; pivots do not update on their own. Press Ctrl+T on your data first so "
        "new rows are picked up automatically."),
    (("if", "ifs"), "**IF** returns one thing when a test passes and another when it fails.\n\n"
        "`=IF(B2>=70, \"Pass\", \"Fail\")`\n\nFor several conditions use IFS rather than nesting:\n\n"
        "`=IFS(B2>=90,\"A\", B2>=80,\"B\", B2>=70,\"C\", TRUE,\"F\")`\n\n"
        "Order matters — IFS stops at the first true test, so go strictest first."),
    (("sumif", "sumifs", "sum only", "sum if"),
        "**SUMIF** adds what matches one condition, **SUMIFS** several.\n\n"
        "`=SUMIF(A2:A100, \"West\", C2:C100)`\n`=SUMIFS(C2:C100, A2:A100,\"West\", B2:B100,\">1000\")`\n\n"
        "Watch the argument order — it flips. SUMIF puts the sum range last, SUMIFS puts it first."),
    (("#n/a", "n/a", "error", "iferror"),
        "`#N/A` means the lookup found nothing. Check for stray spaces with `TRIM()` and for "
        "numbers stored as text.\n\nTo show something friendlier:\n\n"
        "`=IFERROR(VLOOKUP(A2,D:F,3,FALSE), \"Not found\")`\n\n"
        "Wrap it only once you know *why* it errors — IFERROR hides the cause."),
    (("absolute", "dollar sign", "$", "f4"),
        "The `$` locks part of a reference when you copy a formula. Press **F4** to cycle.\n\n"
        "`$A$1` neither moves · `A$1` row locked · `$A1` column locked\n\n"
        "Classic use — a tax rate in one cell:\n\n`=B2*$E$1`\n\n"
        "Without the dollars, row 3 looks at E2 and returns zero. It is the most common "
        "spreadsheet bug there is."),
    (("shortcut", "shortcuts"),
        "The ones worth memorising:\n\n`Ctrl+Arrow` jump to the edge of the data\n"
        "`Ctrl+T` convert to Table\n`Alt+=` AutoSum\n`Ctrl+Shift+L` toggle filters\n"
        "`Ctrl+E` Flash Fill\n`F4` toggle `$` in a reference\n`Ctrl+Shift+V` paste values only\n\n"
        "On a Mac, swap Ctrl for Cmd on most of these."),
    (("duplicate",), "**Remove duplicates:** select the range → Data → Remove Duplicates → tick the "
        "columns that define a duplicate.\n\nThis deletes rows permanently, so copy the sheet first. "
        "To find them without deleting, use Home → Conditional Formatting → Highlight Cells Rules → "
        "Duplicate Values."),
    (("chart", "graph"), "Select your data including headers, then Insert → pick a chart, or press "
        "**Alt+F1** for an instant one.\n\nColumn/bar for comparing categories, line for change over "
        "time, scatter for the relationship between two numbers. Pie only with about five slices or "
        "fewer.\n\nTitle it with the finding — \"Sales fell 12% in Q3\" beats \"Q3 Sales\"."),
]

OFFLINE_MISS = (
    "I do not have a built-in answer for that one.\n\n"
    "You are talking to the **local test server in offline mode**, which only knows a handful of "
    "topics — enough to prove the plugin works end to end. Try VLOOKUP, PivotTables, IF, SUMIF, "
    "#N/A, absolute references, shortcuts, duplicates or charts.\n\n"
    "Set an API key and restart to get real answers to anything."
)

OFF_TOPIC = (
    "I only answer Microsoft Excel questions — that is what my system prompt restricts me to. "
    "Ask me about a formula, a PivotTable, a chart, or an error you are stuck on."
)

EXCEL_HINTS = ("excel","formula","spreadsheet","cell","sheet","pivot","vlookup","xlookup","sum",
               "count","chart","graph","row","column","workbook","csv","filter","sort","macro",
               "#n/a","#ref","#value","table","average","duplicate","shortcut","absolute","$","if")


def offline_answer(msg):
    m = " " + msg.lower().strip() + " "
    best, score = None, 0
    for keys, ans in OFFLINE:
        for k in keys:
            if k in m and len(k) > score:
                best, score = ans, len(k)
    if best:
        return best
    if not any(h in m for h in EXCEL_HINTS):
        return OFF_TOPIC
    return OFFLINE_MISS


def call_openai(turns):
    body = json.dumps({
        "model": OPENAI_MODEL,
        "messages": [{"role": "system", "content": SYSTEM}] + turns,
        "max_tokens": 600, "temperature": 0.3,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions", data=body,
        headers={"Authorization": "Bearer " + OPENAI_KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        d = json.loads(r.read())
    return d["choices"][0]["message"]["content"]


def call_anthropic(turns):
    body = json.dumps({
        "model": ANTHRO_MODEL, "system": SYSTEM,
        "messages": turns, "max_tokens": 600,
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=body,
        headers={"x-api-key": ANTHRO_KEY, "anthropic-version": "2023-06-01",
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        d = json.loads(r.read())
    return d["content"][0]["text"]


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *a):
        pass  # keep the console quiet

    def _json(self, obj, code=200):
        payload = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if self.path.rstrip("/") != "/wp-json/rh-excel-gpt/v1/chat":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            self._json({"error": "bad_request"})
            return

        msg = str(data.get("message", "")).strip()[:1200]
        if not msg:
            self._json({"error": "empty"})
            return

        turns = []
        for h in (data.get("history") or [])[-6:]:
            role = "assistant" if h.get("role") == "assistant" else "user"
            text = str(h.get("text", ""))[:1200]
            if text:
                turns.append({"role": role, "content": text})
        turns.append({"role": "user", "content": msg})

        try:
            if OPENAI_KEY:
                self._json({"reply": call_openai(turns)})
            elif ANTHRO_KEY:
                self._json({"reply": call_anthropic(turns)})
            else:
                self._json({"reply": offline_answer(msg)})
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            self._json({"error": "upstream", "detail": f"{e.code}: {detail}"})
        except Exception as e:
            self._json({"error": "upstream", "detail": str(e)[:300]})


if __name__ == "__main__":
    mode = ("LIVE · OpenAI · " + OPENAI_MODEL) if OPENAI_KEY else \
           ("LIVE · Anthropic · " + ANTHRO_MODEL) if ANTHRO_KEY else \
           "OFFLINE (no API key set — built-in answers)"
    print(f"dev server  http://127.0.0.1:{PORT}/preview/index.html")
    print(f"chat endpoint /wp-json/rh-excel-gpt/v1/chat  [{mode}]")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
