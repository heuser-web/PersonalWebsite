#!/usr/bin/env bash
# Assemble dist/ — the static demo of the site — from an explicit allow-list.
#
# Only what is listed here is published. The repo root is never served, so the
# *.md guides, build/, skill-observations/, assets-generated/, chatbot/ source,
# .git, preview/_*.html harnesses and preview/chatbot-b.html never reach the web.
#
# Layout:  dist/index.html (+ the other preview pages)   -> "/" opens the home page
#          dist/assets/...                                -> preview/assets
#          dist/resume/*.pdf                              -> resume/*.pdf
# preview/resume.html links "../resume/x.pdf"; from the site root the browser
# resolves that to /resume/x.pdf, which is exactly where the PDFs land.
#
# This is a demo only. The graded site is the self-hosted WordPress install.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/dist"

rm -rf "$OUT"
mkdir -p "$OUT/assets" "$OUT/resume"

# 1. Public pages: every preview page except harnesses (_*.html) and chatbot-b.
for f in "$ROOT"/preview/*.html; do
  name="$(basename "$f")"
  case "$name" in
    _*|chatbot-b.html) continue ;;
  esac
  cp "$f" "$OUT/$name"
done

# 2. Assets. rhxg.* belong only to chatbot-b.html (excluded), so they stay out.
( cd "$ROOT/preview/assets" && find . -type f \
    ! -name 'rhxg.*' ! -name '.DS_Store' ! -name '.*' -print0 ) |
while IFS= read -r -d '' rel; do
  mkdir -p "$OUT/assets/$(dirname "$rel")"
  cp "$ROOT/preview/assets/$rel" "$OUT/assets/$rel"
done

# 3. The two resume PDFs (not the HTML sources or _resume.css).
cp "$ROOT"/resume/*.pdf "$OUT/resume/"

# 4. Guards: fail the build if anything off the allow-list slipped in.
bad="$(cd "$OUT" && find . \( -name '*.md' -o -name '_*.html' -o -name 'chatbot-b.html' \
        -o -name '*.php' -o -name '*.py' -o -name '*.mjs' -o -name '.git' \) -print)"
if [ -n "$bad" ]; then
  echo "build_static: refusing to publish:" >&2; echo "$bad" >&2; exit 1
fi
[ -f "$OUT/index.html" ] || { echo "build_static: dist/index.html missing" >&2; exit 1; }

echo "dist/ ready: $(find "$OUT" -type f | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1)"
