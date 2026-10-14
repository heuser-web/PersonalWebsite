#!/usr/bin/env python3
"""Lightweight PHP sanity check (no PHP runtime available on this machine).

Tokenizes past strings, comments and heredocs, then verifies bracket balance
and that every `<?php` region is well formed. Catches the mistakes that
actually break a WordPress theme: an unclosed brace, a stray quote, a
mismatched paren.
"""
import sys, re

def check(path):
    src = open(path, encoding="utf-8").read()
    errs = []
    i, n = 0, len(src)
    stack = []
    line = 1
    in_php = False
    pairs = {')': '(', ']': '[', '}': '{'}

    while i < n:
        c = src[i]
        if c == '\n':
            line += 1; i += 1; continue

        if not in_php:
            if src.startswith('<?php', i) or src.startswith('<?=', i):
                in_php = True
                i += 5 if src.startswith('<?php', i) else 3
            else:
                i += 1
            continue

        # leaving php
        if src.startswith('?>', i):
            in_php = False; i += 2; continue

        # comments
        if src.startswith('//', i) or c == '#':
            j = src.find('\n', i)
            i = n if j == -1 else j
            continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2)
            if j == -1:
                errs.append(f"{path}:{line}: unterminated /* comment"); break
            line += src.count('\n', i, j); i = j + 2; continue

        # heredoc / nowdoc
        m = re.match(r"<<<\s*(['\"]?)([A-Za-z_]\w*)\1\r?\n", src[i:])
        if m:
            tag = m.group(2)
            end = re.search(rf"^\s*{tag}\b", src[i + m.end():], re.M)
            if not end:
                errs.append(f"{path}:{line}: unterminated heredoc {tag}"); break
            seg = src[i:i + m.end() + end.end()]
            line += seg.count('\n'); i += m.end() + end.end(); continue

        # strings
        if c in "'\"":
            q, j = c, i + 1
            while j < n:
                if src[j] == '\\': j += 2; continue
                if src[j] == q: break
                if src[j] == '\n': line += 1
                j += 1
            if j >= n:
                errs.append(f"{path}:{line}: unterminated {q} string"); break
            i = j + 1; continue

        if c in '([{':
            stack.append((c, line)); i += 1; continue
        if c in ')]}':
            if not stack:
                errs.append(f"{path}:{line}: unexpected '{c}'"); i += 1; continue
            op, ol = stack.pop()
            if op != pairs[c]:
                errs.append(f"{path}:{line}: '{c}' closes '{op}' opened line {ol}")
            i += 1; continue
        i += 1

    for op, ol in stack:
        errs.append(f"{path}: unclosed '{op}' opened at line {ol}")
    return errs

if __name__ == "__main__":
    bad = 0
    for f in sys.argv[1:]:
        e = check(f)
        if e:
            bad += 1
            for x in e: print("  ERROR", x)
            print(f"FAIL {f}")
        else:
            print(f"OK   {f}")
    sys.exit(1 if bad else 0)
