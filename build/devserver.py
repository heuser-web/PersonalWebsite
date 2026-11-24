#!/usr/bin/env python3
"""Local dev server for the IS101 preview.

Serves the static preview AND implements the same REST contract the WordPress
plugin uses:

    POST /wp-json/rh-excel-gpt/v1/chat   {"message": "...", "history": [...]}
        -> {"reply": "..."}  |  {"error": "..."}

Set OPENAI_API_KEY or ANTHROPIC_API_KEY and it calls the real model with the
plugin's real system prompt. With no key it reports not_configured, and the
chat falls back to its built-in answers, exactly as WordPress does. Open
preview/chatbot-b.html?live to send questions here.

    python3 build/devserver.py [port]
"""
import json, os, pathlib, re, sys, urllib.request, urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8155

SYSTEM = (pathlib.Path(__file__).resolve().parent.parent / "chatbot" / "rh-excel-gpt" / "system-prompt.txt").read_text().strip()

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
ANTHRO_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
OPENAI_MODEL = os.environ.get("RHXG_MODEL", "gpt-6-luna")
ANTHRO_MODEL = os.environ.get("RHXG_MODEL", "claude-haiku-5-5")


def post(url, headers, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read())


def call_openai(turns):
    thinks = bool(re.match(r"(gpt-[5-9]|o\d)", OPENAI_MODEL))
    body = {"model": OPENAI_MODEL, "messages": [{"role": "system", "content": SYSTEM}] + turns,
            "max_completion_tokens": 3000 if thinks else 900}
    body.update({"reasoning_effort": "low"} if thinks else {"temperature": 0.3})
    d = post("https://api.openai.com/v1/chat/completions", {"Authorization": "Bearer " + OPENAI_KEY}, body)
    return d["choices"][0]["message"]["content"]


def call_anthropic(turns):
    d = post("https://api.anthropic.com/v1/messages",
             {"x-api-key": ANTHRO_KEY, "anthropic-version": "2023-06-01"},
             {"model": ANTHRO_MODEL, "system": SYSTEM, "messages": turns, "max_tokens": 3000})
    return "".join(b.get("text", "") for b in d["content"] if b.get("type") == "text")


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *a):
        pass  # keep the console quiet

    def end_headers(self):
        # Without this the browser may reuse old CSS/JS after a rebuild.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

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
            if text and (turns or role == "user"):
                turns.append({"role": role, "content": text})
        turns.append({"role": "user", "content": msg})

        try:
            if OPENAI_KEY:
                self._json({"reply": call_openai(turns)})
            elif ANTHRO_KEY:
                self._json({"reply": call_anthropic(turns)})
            else:
                self._json({"error": "not_configured"})
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            self._json({"error": "upstream", "detail": f"{e.code}: {detail}"})
        except Exception as e:
            self._json({"error": "upstream", "detail": str(e)[:300]})


if __name__ == "__main__":
    mode = ("LIVE · OpenAI · " + OPENAI_MODEL) if OPENAI_KEY else \
           ("LIVE · Anthropic · " + ANTHRO_MODEL) if ANTHRO_KEY else \
           "no API key set, so the chat uses its built-in answers"
    print(f"dev server  http://127.0.0.1:{PORT}/preview/index.html")
    print(f"chat endpoint /wp-json/rh-excel-gpt/v1/chat  [{mode}]")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
