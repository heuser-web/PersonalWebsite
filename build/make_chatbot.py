#!/usr/bin/env python3
"""Build all three Excel bots from one source.

chatbot/src/topics.md     the knowledge base
chatbot/src/functions.txt the function dictionary
chatbot/src/brain.js      the engine
chatbot/src/widget.html   the inline panel

writes
  chatbot/excel-gpt-chatbot.html               paste into a Custom HTML block
  chatbot/rh-excel-gpt/assets/excel-brain.js   the plugin's built-in answers
  chatbot/rh-excel-gpt/views/helper.html       the same panel for [rh_excel_helper]
  chatbot/custom-gpt/excel-reference.md        knowledge file for the ChatGPT GPT
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, BOT = ROOT / "chatbot" / "src", ROOT / "chatbot"


def load_topics():
    text = (SRC / "topics.md").read_text()
    topics = []
    for block in re.split(r"^## ", text, flags=re.M)[1:]:
        title, rest = block.split("\n", 1)
        meta, lines = {}, rest.split("\n")
        while lines and (m := re.match(r"(id|keys|ask|next):\s*(.*)$", lines[0])):
            meta[m[1]] = m[2].strip()
            lines.pop(0)
        parts = re.split(r"^### (Example|Fix|Mac)\n", "\n".join(lines), flags=re.M)
        t = {
            "id": meta["id"], "title": title.strip(),
            "keys": [k.strip().lower() for k in meta["keys"].split(";") if k.strip()],
            "ask": [k.strip() for k in meta.get("ask", "").split(";") if k.strip()],
            "next": [k.strip() for k in meta.get("next", "").split(",") if k.strip()],
            "body": parts[0].strip(),
        }
        for name, body in zip(parts[1::2], parts[2::2]):
            t[{"Example": "ex", "Fix": "fix", "Mac": "mac"}[name]] = body.strip()
        topics.append(t)
    ids = [t["id"] for t in topics]
    bad = [i for i in ids if ids.count(i) > 1]
    bad += [f"{t['id']} -> {n}" for t in topics for n in t["next"] if n not in ids]
    if bad:
        sys.exit("topics.md: duplicate ids or broken links: " + ", ".join(sorted(set(bad))))
    return topics


def load_funcs():
    out = {}
    for line in (SRC / "functions.txt").read_text().splitlines():
        if not line.strip():
            continue
        p = line.split("|")
        out[p[0]] = {"s": p[1], "d": p[2], **({"v": p[3]} if len(p) > 3 else {})}
    return out


def js(obj):
    # "</" inside a string would close an inline <script>.
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def main():
    topics, funcs = load_topics(), load_funcs()
    brain = (SRC / "brain.js").read_text()
    for marker, data in (("/*TOPICS*/[]", topics), ("/*FUNCS*/{}", funcs)):
        if brain.count(marker) != 1:
            sys.exit(f"brain.js: expected exactly one {marker}")
        brain = brain.replace(marker, js(data))
    if "</script" in brain.lower():
        sys.exit("brain.js must not contain a closing script tag")
    (BOT / "rh-excel-gpt" / "assets" / "excel-brain.js").write_text(brain)

    widget_src = SRC / "widget.html"
    if widget_src.exists():
        w = widget_src.read_text()
        if w.count("/*BRAIN*/") != 1:
            sys.exit("widget.html: expected exactly one /*BRAIN*/")
        (BOT / "excel-gpt-chatbot.html").write_text(w.replace("/*BRAIN*/", brain))
        # The plugin loads the engine as its own file, so its copy leaves it out.
        panel = re.sub(r"<!--BRAIN-->.*?<!--/BRAIN-->", "", w, flags=re.S)
        panel = re.sub(r"^<!-- =.*?-->\s*", "", panel, flags=re.S)
        panel = re.sub(r"<script>window\.XLBOT_GPT_URL.*?</script>\s*", "", panel)
        views = BOT / "rh-excel-gpt" / "views"
        views.mkdir(exist_ok=True)
        (views / "helper.html").write_text(panel)

    kdir = BOT / "custom-gpt"
    kdir.mkdir(exist_ok=True)
    ref = ["# Excel reference", "", "Verified answers for Excel Helper. Prefer these over memory when they cover the question.", ""]
    for t in topics:
        ref += [f"## {t['title']}", "", "People ask: " + "; ".join(t["ask"]) + ".", "", t["body"], ""]
        for key, name in (("ex", "Example"), ("fix", "If it is not working"), ("mac", "On a Mac")):
            if t.get(key):
                ref += [f"### {t['title']}: {name}", "", t[key], ""]
    ref += ["## Function list", "", "If a function is not listed here, check that it exists before using it.", "",
            "| Function | Syntax | What it does | Needs |", "|---|---|---|---|"]
    for n, f in funcs.items():
        need = {"365": "Microsoft 365"}.get(f.get("v"), f"Excel {f['v']}+ or Microsoft 365" if f.get("v") else "any version")
        ref.append(f"| {n} | `={f['s']}` | {f['d']} | {need} |")
    (kdir / "excel-reference.md").write_text("\n".join(ref) + "\n")
    print(f"{len(topics)} topics, {len(funcs)} functions, brain {len(brain)//1024} KB")


if __name__ == "__main__":
    main()
