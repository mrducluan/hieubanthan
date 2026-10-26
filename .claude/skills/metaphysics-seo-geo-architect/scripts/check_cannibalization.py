#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Flag pages that probably compete for the same search intent.

Usage:
    python check_cannibalization.py matrix.json [--existing urls.txt] [--threshold 0.6]

matrix.json: list of {"slug": "/tu-vi/...", "keyword": "...", "intent": "..."}.
existing urls.txt: one URL or path per line (sitemap export). Existing pages are compared
with the new ones; two existing pages are not compared with each other.
Comparison ignores diacritics, common Vietnamese function words, years, and the first
URL segment (the silo). This is a heuristic
for catching obvious overlap; a human still decides whether to merge or re-scope.
Exit code: 0 no overlap, 1 overlaps found, 2 bad input. Standard library only.
"""
import argparse
import json
import re
import sys
import unicodedata

STOP = set("la gi cua va cho trong o tai the nao co nen khi voi duoc mot cac nhung nay do thi de ve tu den hay hon sao".split())


def norm_tokens(text):
    t = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return {w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP and not re.fullmatch(r"20\d\d", w)}


def jaccard(a, b):
    return len(a & b) / len(a | b) if a and b else 0.0


def path_tokens(path):
    """Tokens of a URL path, ignoring the first segment (the silo), so the same intent
    placed in two silos still counts as overlap."""
    segs = [s for s in re.sub(r"^https?://[^/]+", "", path).strip("/").split("/") if s]
    return norm_tokens(" ".join(segs[1:] if len(segs) > 1 else segs))


def page_tokens(row):
    return norm_tokens(row.get("keyword", "")) | path_tokens(row.get("slug", ""))


def find_overlaps(rows, existing, threshold):
    found = []
    items = [(r.get("slug", "?"), page_tokens(r), "new") for r in rows]
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            s = jaccard(items[i][1], items[j][1])
            if s >= threshold:
                found.append((s, items[i][0], items[j][0], "both new"))
    for slug, toks, _ in items:
        for url in existing:
            s = jaccard(toks, path_tokens(url))
            if s >= threshold:
                found.append((s, slug, url, "new vs existing"))
    return sorted(found, reverse=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("matrix")
    ap.add_argument("--existing")
    ap.add_argument("--threshold", type=float, default=0.6)
    args = ap.parse_args(argv)
    try:
        rows = json.load(open(args.matrix, encoding="utf-8"))
        existing = [l.strip() for l in open(args.existing, encoding="utf-8") if l.strip()] if args.existing else []
        if not isinstance(rows, list):
            raise ValueError("matrix must be a JSON list")
    except (OSError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    found = find_overlaps(rows, existing, args.threshold)
    if not found:
        print(f"no overlap at threshold {args.threshold}")
        return 0
    print(f"possible cannibalization (threshold {args.threshold}):")
    for s, a, b, kind in found:
        print(f"  {s:.2f}  {a}  <->  {b}  [{kind}] -> merge, or give each a different intent signature")
    return 1


if __name__ == "__main__":
    sys.exit(main())
